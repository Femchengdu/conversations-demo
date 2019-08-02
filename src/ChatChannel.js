import React, { Component } from 'react';
import './Chat.css';
import MessageBubble from './MessageBubble'
import Dropzone from 'react-dropzone';
import styles from './ChatChannel.module.css'
import {Button, Form, Input} from "antd";
import ChatMessages from "./ChatMessages";
import PropTypes from "prop-types";

class ChatChannel extends Component {
  constructor(props) {
    super(props);
    this.state = {
        newMessage: '',
        channelProxy: props.channelProxy,
        messages: [],
        loadingState: 'initializing',
        boundChannels: new Set()
    };
  }

  loadMessagesFor = (thisChannel) => {
    if (this.state.channelProxy === thisChannel) {
        thisChannel.getMessages()
            .then(messagePaginator => {
                if (this.state.channelProxy === thisChannel) {
                    this.setState({ messages: messagePaginator.items, loadingState: 'ready' });
                }
            })
            .catch(err => {
                console.error("Couldn't fetch messages IMPLEMENT RETRY", err);
                this.setState({ loadingState: "failed" });
            });
    }
  };

  componentDidMount = () => {
      if (this.state.channelProxy) {
        this.loadMessagesFor(this.state.channelProxy);

        if (!this.state.boundChannels.has(this.state.channelProxy)) {
            let newChannel = this.state.channelProxy;
            newChannel.on('messageAdded', m => this.messageAdded(m, newChannel));
            this.setState({boundChannels: new Set([...this.state.boundChannels, newChannel])});
        }
      }
  }

  componentDidUpdate = (oldProps, oldState) => {
    if (this.state.channelProxy !== oldState.channelProxy) {
        this.loadMessagesFor(this.state.channelProxy);

        if (!this.state.boundChannels.has(this.state.channelProxy)) {
            let newChannel = this.state.channelProxy;
            newChannel.on('messageAdded', m => this.messageAdded(m, newChannel));
            this.setState({boundChannels: new Set([...this.state.boundChannels, newChannel])});
        }
    }
  };

  static getDerivedStateFromProps(newProps, oldState) {
    let logic = (oldState.loadingState === 'initializing') || oldState.channelProxy !== newProps.channelProxy;
    if (logic) {
      return { loadingState: 'loading messages', channelProxy: newProps.channelProxy };
    } else {
      return null;
    }
  }

  messageAdded = (message, targetChannel) => {
    if (targetChannel === this.state.channelProxy)
        this.setState((prevState, props) => ({
            messages: [...prevState.messages, message]
        }));
  };

  onMessageChanged = event => {
    this.setState({ newMessage: event.target.value });
  };

  sendMessage = event => {
    event.preventDefault();
    const message = this.state.newMessage;
    this.setState({ newMessage: '' });
    this.state.channelProxy.sendMessage(message);
  };

  onDrop = acceptedFiles => {
    this.state.channelProxy.sendMessage({contentType: acceptedFiles[0].type, media: acceptedFiles[0]});
  };
  
  render = () => {
    return (
        <div id="OpenChannel">
          <div style={{flexBasis: "80%", flexGrow: 2}}>
            <ChatMessages
                identity={this.props.myIdentity}
                messages={this.state.messages}/>
          </div>
          <div style={{flexBasis: "5%"}}>
            <Form onSubmit={this.sendMessage}>
              <Input.Group compact={true} style={{width: "100%", display: "flex", flexDirection: "row"}}>
              <Input
                  style={{flexBasis: "100%"}}
                placeholder={"Type your message here..."}
                type={"text"}
                name={"message"}
                id={styles['type-a-message']}
                autoComplete={"off"}
                disabled={this.state.loadingState !== 'ready'}
                onChange={this.onMessageChanged}
                value={this.state.newMessage}
              />
                <Button icon="enter" htmlType="submit" type={"submit"}/>
              </Input.Group>
            </Form>
          </div>
          <div style={{flexBasis: "15%"}}>
            <Dropzone
                onDrop={this.onDrop}
                accept="image/*">
                {({getRootProps, getInputProps, isDragActive}) => (
                    <div {...getRootProps()} className={`${styles.Dropzone} ${isDragActive? styles.Highlight : ''}`}>
                        <input id="files" {...getInputProps()} />
                        <p>Drag Files Here</p>
                    </div>
                )}
            </Dropzone>
          </div>
        </div>
    );
  }
}

ChatChannel.propTypes = {
  myIdentity: PropTypes.string.isRequired
};

export default ChatChannel;