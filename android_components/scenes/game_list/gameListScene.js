import React, { Component } from 'react';
import { Application } from '../../../shared_components/application.js';
import { LoadingButton } from '../../buttons/loadingButton.js';
import { ToggleButton } from '../../buttons/toggleButton.js';
import { LoadingSpinner } from '../../misc/loadingSpinner.js';
import { GameDetailScene } from '../game_detail/gameDetailScene.js';

import {
  Text,
  StyleSheet,
  ListView,
  View,
  ActivityIndicator,
  ToastAndroid,
  Alert
} from 'react-native';

const errorRow = [{
  ID : -1,
  Name: 'An error occurred, please retry.',
  Description : '',
  MaxPlayers : -1
}];

const emptyGamesRow = [{
  ID : -1,
  Name: 'Hello. It looks like the catalogue is empty, please wait until some vendor adds one',
  Description : '',
  MaxPlayers : -1
}];

const dataSourceModel = new ListView.DataSource({rowHasChanged : (r1, r2) => r1 !== r2});

export class GameListScene extends Component {
  constructor(props) {
    super(props);
    this.renderRow = this._renderRow.bind(this);
  }

  componentWillMount() {
    this.setState({
      loading : true,
      datasource : dataSourceModel.cloneWithRows([]),
      rows : [],
      isDummy : false
    });
  }

  componentDidMount() {
      setTimeout(() => {
        this.getGames();
      }, 300); //waiting for UI to show before requesting, navigator animation end.
      //TODO : find another way, like triggering navigator.
  }


  _removeHandler(game) {
    const { rows } = this.state;
    for (i = 0; i < rows.length; i++) {
      if (rows[i].ID == game.ID) {
        rows.splice(i, 1);
        break;
      }
    }
    this.setState({
      rows : rows,
      datasource : dataSourceModel.cloneWithRows(rows)
    });
  }

  getGames() {
    this.setState({loading : true});
    const request = {
      method : 'POST',
      headers : {
        'Accept' : 'application/json',
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
        Type : 'UserGameList',
        API_Token : Application.APIToken,
        SessionToken : Application.SessionToken
      })
    };
    fetch('http://gamemate.di.unito.it:8080/user/game/list/all', request)
        .then((response) => response.json())
        .then((responseJson) => {
          switch (responseJson.Type) {
            case 'UserGameList':
            console.warn(JSON.stringify(responseJson));
              const emptyList = responseJson.Games.length == 0,
                    rows = emptyList ? emptyGamesRow : responseJson.Games;
              this.setState({
                isDummy : emptyList,
                rows : rows,
                datasource : dataSourceModel.cloneWithRows(rows)
              });
              break;
            case 'ErrorDetail':
              ToastAndroid.show('There was a problem : ' + responseJson.ErrorMessage, ToastAndroid.LONG);
              this.setState({
                isDummy : true,
                rows : errorRow,
                datasource : dataSourceModel.cloneWithRows(errorRow)
              });
              break;
            default:
              ToastAndroid.show('There was a problem while getting your list of games', ToastAndroid.LONG);
              this.setState({
                isDummy : true,
                rows : errorRow,
                datasource : dataSourceModel.cloneWithRows(errorRow)
              });
              console.warn(JSON.stringify(responseJson));
          }
          this.setState({loading : false});
        }).catch((error) => {
          ToastAndroid.show('Problems during the download of the game list', ToastAndroid.LONG);
          this.setState({
            isDummy : true,
            rows : errorRow,
            datasource : dataSourceModel.cloneWithRows(errorRow),
            loading : false
          });
          console.warn(JSON.stringify(error));
        });
  }

  render() {
    const { loading, adding, datasource } = this.state;
    let partial = [];
    if(loading) {
      partial.push(
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator style={styles.loader} animating={true} size='large'/>
          <Text style={styles.loaderText}>Loading game list...</Text>
        </View>
      );
    } else {
      partial.push(
        <ListView style={styles.list}
                  dataSource={datasource}
                  renderRow={this.renderRow}
          />
      );
    }
    return (
      <View style={styles.container}>
        {partial}
      </View>
    );
  }

  _renderRow(singleGame) {
    return (
      <TokenRow game={singleGame}
                isDummy={this.state.isDummy}
                navigator={this.props.navigator}/>
    );
  }
}

class TokenRow extends Component {
  constructor(props) {
    super(props);
    this.showDetail = this._showDetail.bind(this);
    this.sendAction = this._sendAction.bind(this);
  }

  componentWillMount() {
    const { game } = this.props;
    this.setState({
      game : game,
      acting : false
    });
  }

  _sendAction() {
    const { game } = this.state,
    request = {
      method : 'POST',
      headers : {
        'Accept' : 'application/json',
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
        Type : 'GameAction',
        API_Token : Application.APIToken,
        SessionToken : Application.SessionToken,
        GameID : parseInt(game.ID),
        UserID : -1,
        Action : !game.Enabled
      })
    };
    this.setState({acting:true});
    fetch("http://gamemate.di.unito.it:8080/game/action", request)
      .then((response) => response.json())
      .then((responseJson) => {
        switch(responseJson.Type) {
          case "GameAction":
            game.Enabled = !game.Enabled;
            break;
          case "ErrorDetail" :
            ToastAndroid.show("Action unsuccessfull : " + responseJson.ErrorMessage, ToastAndroid.SHORT);
            break;
          default:
            ToastAndroid.show("Unknown error, retry", ToastAndroid.SHORT);
            break;
        }
        this.setState({acting:false});
      }).catch((error) => {
        ToastAndroid.show("Unknown response, retry", ToastAndroid.SHORT);
        this.setState({acting:false});
        console.warn(JSON.stringify(error.message));
      });
  }

  _showDetail() {
    const { navigator, game } = this.props;
    navigator.push({
      name : 'Game Detail',
      component : GameDetailScene,
      passProps : {
        game : game
      }
    });
  }

  render() {
    const { isDummy } = this.props,
          { game, acting } = this.state,
          visible = isDummy ? 0 : 1;
    let partial = [];
    partial.push(
      <Text style={styles.rowText}>
        {game.Name}
      </Text>
    );
    if(!isDummy) {
      const enabledText = game.Enabled == true ? "Disable" : "Enable";
      partial.push(
        <View style={{flex:1, flexDirection:'row'}}>
          <ToggleButton
            style={[styles.buttonNormal, {flex:2, opacity : visible, margin:5}]}
            underlayColor='gray'
            onPress={this.showDetail}
            text='Detail' />
          <LoadingButton
            loading={acting}
            style={[styles.buttonNormal, {flex:2, opacity : visible, margin:5}]}
            underlayColor="gray"
            onPress={this.sendAction}
            text={enabledText} />
        </View>
      );
    }

    return (
      <View style={styles.row}>
        {partial}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    flexDirection : 'column',
    backgroundColor:'white'
  },
  list: {
    flex:10,
    flexDirection:'column',
    marginTop : 60, //navbar
    //backgroundColor:'red'
  },
  row: {
    flex:1,
    flexDirection:'row',
    alignItems:'center',
    paddingTop : 10,
    borderBottomWidth : 1,
    //borderBottomColor:'gray',
    height:80,
    padding : 5
  },
  rowText : {
    flex:1,
    //backgroundColor:'yellow'
  },
  buttonNormal : {
    alignItems:'center',
    justifyContent:'center',
    borderRadius:30,
    backgroundColor : 'lightgray',
    height:40
  },
  loader : {
    flex:2,
    justifyContent : 'flex-end'
  },
  loaderText : {
    flex : 1
  },
  center : {
    alignItems : 'center'
  }
});
