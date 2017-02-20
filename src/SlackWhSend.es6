import request from 'superagent';
import config from '../package.json';

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

function constructPayload(context) {
  const payload = {};

  if(context._text) payload.text = context._text;
  if(context._channel) payload.channel = context._channel;
  if(context._icon) {
    if(context._icon.charAt(0) === ':') payload.icon_emoji = context._icon;
    else payload.icon_url = context._icon;
  }
  if(context._username) payload.username = context._username;

  if(context._attachments && context._attachments.length){
    //construct attachments
    payload.attachments = context._attachments;
  }
  return payload;
}

class SlackWhSend {

  constructor(urlWebhook, argsObj) {
    if(!urlWebhook) throw new Error('[urlWebhook] param is necessary');
    this._urlWebhook = urlWebhook;
    this._resetVariables();

    (argsObj ? Object.keys(argsObj).forEach(key => {
      if(this.hasOwnProperty(`_${key}`) &&
        Object.prototype.toString.call(this[`_${key}`]) !== '[object Function]') {
        this[`_${key}`] = argsObj[key];
      }
    }) : 0);
  }

  init(text) {
    const sendConfiguratorPromise =
      new SendConfiguratorPromise(this, text, this._send.bind(this));
    return sendConfiguratorPromise;
  }

  get version() {
    return config.version;
  }

  set version(version){
    throw new Error('version is only readable');
  }

  get urlWebhook() {
    return this._urlWebhook;
  }

  set urlWebhook(urlWebhook) {
    this._urlWebhook = urlWebhook;
    return this;
  }

  _resetVariables() {
    this._text = null;
    this._channel = '#general';
    this._attachments = null;
    this._icon = null;
    this._username = null;
    return this;
  }

  // TODO valid variables for correct message format
  _validVariables() {
    return true;
  }

  _send(resolve, reject) {
    if(!this._validVariables()) return;

    const payload = constructPayload(this);

    try {
      request
      .post(this._urlWebhook)
      .send(payload)
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        this._resetVariables();
        if(err !== null) reject(err.response.error);
        else resolve(res.text);
      });
    } catch (err) {
      reject(err);
    }


  }

}

class SendConfiguratorPromise {
  constructor(context, text, fnSend){
    this.context = context;
    this.context._text = text;
    this.context._attachments = [];
    this._fnSend = fnSend;
  }

  send() { return new Promise(this._fnSend); }

  // attachment message
  noFieldMessage() {
    delete this._getLastAttachment().fields;
    return this;
  }

  // attachment message
  fieldMessage(fieldMessage) {
    this._initLastField();
    this._getLastAttachment().fields[0].value = fieldMessage
    return this;
  }

  // attachment message
  field(field) {
    this._initLastField();
    this._getLastAttachment().fields[0].title = field
    return this;
  }

  // attachment message
  message(message) {
    this._getLastAttachment().text = message;
    return this;
  }

  // attachment message
  color(color) {
    if(color.charAt(0) !== '#' && ['good', 'danger', 'warning'].indexOf(color) === -1) {
      throw new Error('[color] param is not a valid color. Please select ' +
        'one of "good", "danger", "warning" or hexadecimal color');
    }
    this._getLastAttachment().color = color;
    return this;
  }

  // attachment message
  author(author) {
    this._getLastAttachment().author_name = author;
    return this;
  }

  // attachment message
  noFooter() {
    delete this._getLastAttachment().footer;
    return this;
  }

  // attachment message
  defaultFooter(){
    this.footer('Date');
    this.footerValue('ts');
    return this;
  }

  // attachment message
  footer(footer) {
    this._getLastAttachment().footer = footer;
    return this;
  }

  // attachment message
  footerValue(footerValue) {
    if(footerValue === 'ts') {
      this._getLastAttachment().ts = Math.floor(Date.now() / 1000);
    }else{
      delete this._getLastAttachment().ts;
      this._getLastAttachment().footer += ` | ${footerValue}`;
    }
    return this;
  }

  newAttachment(message) {
    this.context._attachments = this.context._attachments || [];
    this.context._attachments.push({
      text: message
    });
    return this;
  }

  useAttachments(attachments) {
    this.context._attachments = attachments;
    return this;
  }

  combineAttachments(attachments) {
    this.context._attachments = this.context._attachments || [];
    this.context._attachments = this.context._attachments.concat(attachments);
    return this;
  }

  // global message
  channel(channel) {
    if(channel.charAt(0) !== '#' && channel.charAt(0) !== '@') {
      channel = `#${channel}`;
    }
    this.context._channel = channel;
    return this;
  }

  // global message
  icon(icon) {
    this.context._icon = icon;
    return this;
  }

  // global message
  username(username) {
    this.context._username = username;
    return this;
  }

  _getLastAttachment() {
    if(!this.context._attachments || !this.context._attachments.length) {
      this.context._attachments = [{}];
    }
    return this.context._attachments[this.context._attachments.length - 1];
  }

  _initLastField() {
    this._getLastAttachment().fields = this._getLastAttachment().fields || [{
        short: true
      }];
  }
}

export default SlackWhSend;