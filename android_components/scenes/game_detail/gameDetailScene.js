import React, { Component } from 'react';
import { LoadingButton } from '../../buttons/loadingButton.js';
import { Application } from '../../../shared_components/application.js';
import { GameListScene } from '../game_list/gameListScene.js';

import {
  Text, StyleSheet, TextInput, View, ScrollView, ToastAndroid
} from 'react-native';

export class GameDetailScene extends Component {
  constructor(props) {
    super(props);
    this.sendAction = this._sendAction.bind(this);
  }

  componentWillMount() {
    const { game } = this.props;
    this.setState({
      acting : false,
      game : game
    });
    setTimeout(() => {}, 300);
  }

  render() {
    const { game, acting } = this.state,
          enabledText = game.Enabled ? "Enabled" : "Disabled",
          action = game.Enabled ? "Disable" : "Enable";
    return (
      <View style={{flex:1}}>
        <ScrollView style={styles.container}>
          <Text style={[styles.textRow]}>
            <Text style={styles.bold}>Name : </Text>{game.Name}
          </Text>
          <Text style={[styles.textRow]}>
            Currently this game is <Text style={styles.bold}>{enabledText}</Text> for you.
          </Text>
        </ScrollView>
        <LoadingButton style={styles.button}
                       loading={acting}
                       onPress={this.sendAction}
                       underlayColor='gray'
                       text={action}/>
      </View>
    );
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
    this.setState({ acting:true });
    fetch("http://gamemate.di.unito.it:8080/game/action", request)
      .then((response) => response.json())
      .then((responseJson) => {
        switch(responseJson.Type) {
          case "GameAction":
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
        console.warn(error.message);
      });
  }
}

const styles = StyleSheet.create({
  container : {
    flex:1,
    flexDirection:'column',
    marginTop:60,
    margin:5
  },
  textRow : {
    flexDirection:'row',
    height:80,
    margin:20,
    marginBottom:10,
    alignItems:'center'
  },
  inputRow : {
    flexDirection : 'row',
    margin:20,
    marginBottom:10,
    alignItems:'center',
    justifyContent:'center'
  },
  input : {
    flex:1,
    height:50
  },
  description : {
    height:100
  },
  bold : {
    fontWeight : 'bold'
  },
  button : {
    alignItems:'center',
    justifyContent:'center',
    height:100,
    borderRadius:0,
    backgroundColor : 'lightgray'
  }
});
