/*global Listener ListenerProviders LocalStorageManager*/
'use strict';
const scriptVirtualProtocol = 'dropfeeds://';
const scriptListKey = 'scriptList';
const scriptObjKey = 'scriptObj-';
const scriptCodeKey = 'scriptCode-';
const scriptType = {
  feedTransformer: 0,
  virtualFeed: 1
};

class UserScriptTools { /* exported UserScriptTools */
  static get instance() { return (this._instance = this._instance || new this()); }

  constructor() {
    this._scriptList = [];
    this._scriptObjList = [];
  }

  async init_async() {
    Listener.instance.subscribe(ListenerProviders.localStorage, scriptListKey, UserScriptTools._updateScriptList_sbscrb, true);
  }

  async runFeedTransformerScripts_async(url, feedText) {
    for (let scriptObj of this._scriptObjList) {
      if (scriptObj.type == scriptType.feedTransformer) {
        let matches = url.match(scriptObj.urlRegEx);
        if (matches) {
          feedText = await this._runScript_async(scriptObj, feedText);
        }
      }
    }
    return feedText;
  }

  async downloadVirtualFeed_async(url) {
    let scriptId = url.substring(scriptVirtualProtocol.length).trim();
    let scriptCode = await LocalStorageManager.getValue_async(scriptCodeKey + scriptId, null);
    if (scriptCode) {
      let virtualFeedScript = new Function(scriptCode);
      let feedText = virtualFeedScript();
      return feedText;
    }
  }

  async _runScript_async(scriptObj, feedText) {
    let scriptCode = await LocalStorageManager.getValue_async(scriptCodeKey + scriptObj.id, null);
    if (scriptCode) {
      let userScriptFunction = new Function('__feedText__', scriptCode);
      let feedTextUpdated = userScriptFunction(feedText);
      feedText = feedTextUpdated || feedText;
    }
    return feedText;
  }


  static async _updateScriptList_sbscrb(value) {
    let self = UserScriptTools.instance;
    self._scriptList = value;
    self._listenScriptObjListUpdate_async();
  }

  async _listenScriptObjListUpdate_async() {
    for (let scriptId of this._scriptList) {
      Listener.instance.subscribe(ListenerProviders.localStorage, scriptObjKey + scriptId, UserScriptTools._updateScriptObjList_sbscrb, true);
    }
  }

  static async _updateScriptObjList_sbscrb() {
    let self = UserScriptTools.instance;
    self._scriptObjList = [];
    for (let scriptId of self._scriptList) {
      let scriptObj = await LocalStorageManager.getValue_async(scriptObjKey + scriptId, null);
      if (scriptObj) {
        self._scriptObjList.push(scriptObj);
      }
    }
  }
}
