'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function constructPayload(context) {
  var payload = {};

  if (context._text) payload.text = context._text;
  if (context._channel) payload.channel = context._channel;
  if (context._icon) {
    if (context._icon.charAt(0) === ':') payload.icon_emoji = context._icon;else payload.icon_url = context._icon;
  }
  if (context._username) payload.username = context._username;

  if (context._attachments && context._attachments.length) {
    //construct attachments
    payload.attachments = context._attachments;
  }
  return payload;
}

var SlackWhSend = function () {
  function SlackWhSend(urlWebhook, argsObj) {
    var _this = this;

    _classCallCheck(this, SlackWhSend);

    if (!urlWebhook) throw new Error('[urlWebhook] param is necessary');
    this._urlWebhook = urlWebhook;
    this._resetVariables();

    argsObj ? Object.keys(argsObj).forEach(function (key) {
      if (_this.hasOwnProperty('_' + key) && Object.prototype.toString.call(_this['_' + key]) !== '[object Function]') {
        _this['_' + key] = argsObj[key];
      }
    }) : 0;
  }

  _createClass(SlackWhSend, [{
    key: 'init',
    value: function init(text) {
      var sendConfiguratorPromise = new SendConfiguratorPromise(this, text, this._send.bind(this));
      return sendConfiguratorPromise;
    }
  }, {
    key: '_resetVariables',
    value: function _resetVariables() {
      this._text = null;
      this._channel = '#general';
      this._attachments = null;
      this._icon = null;
      this._username = null;
      return this;
    }

    // TODO valid variables for correct message format

  }, {
    key: '_validVariables',
    value: function _validVariables() {
      return true;
    }
  }, {
    key: '_send',
    value: function _send(resolve, reject) {
      var _this2 = this;

      if (!this._validVariables()) return;

      var payload = constructPayload(this);

      try {
        _superagent2.default.post(this._urlWebhook).send(payload).set('Content-Type', 'application/json').end(function (err, res) {
          _this2._resetVariables();
          if (err !== null) reject(err.response.error);else resolve(res.text);
        });
      } catch (err) {
        reject(err);
      }
    }
  }, {
    key: 'version',
    get: function get() {
      return _package2.default.version;
    },
    set: function set(version) {
      throw new Error('version is only readable');
    }
  }, {
    key: 'urlWebhook',
    get: function get() {
      return this._urlWebhook;
    },
    set: function set(urlWebhook) {
      this._urlWebhook = urlWebhook;
      return this;
    }
  }]);

  return SlackWhSend;
}();

var SendConfiguratorPromise = function () {
  function SendConfiguratorPromise(context, text, fnSend) {
    _classCallCheck(this, SendConfiguratorPromise);

    this.context = context;
    this.context._text = text;
    this.context._attachments = [];
    this._fnSend = fnSend;
  }

  _createClass(SendConfiguratorPromise, [{
    key: 'send',
    value: function send() {
      return new Promise(this._fnSend);
    }

    // attachment message

  }, {
    key: 'noFieldMessage',
    value: function noFieldMessage() {
      delete this._getLastAttachment().fields;
      return this;
    }

    // attachment message

  }, {
    key: 'fieldMessage',
    value: function fieldMessage(_fieldMessage) {
      this._initLastField();
      this._getLastAttachment().fields[0].value = _fieldMessage;
      return this;
    }

    // attachment message

  }, {
    key: 'field',
    value: function field(_field) {
      this._initLastField();
      this._getLastAttachment().fields[0].title = _field;
      return this;
    }

    // attachment message

  }, {
    key: 'message',
    value: function message(_message) {
      this._getLastAttachment().text = _message;
      return this;
    }

    // attachment message

  }, {
    key: 'color',
    value: function color(_color) {
      if (_color.charAt(0) !== '#' && ['good', 'danger', 'warning'].indexOf(_color) === -1) {
        throw new Error('[color] param is not a valid color. Please select ' + 'one of "good", "danger", "warning" or hexadecimal color');
      }
      this._getLastAttachment().color = _color;
      return this;
    }

    // attachment message

  }, {
    key: 'author',
    value: function author(_author) {
      this._getLastAttachment().author_name = _author;
      return this;
    }

    // attachment message

  }, {
    key: 'noFooter',
    value: function noFooter() {
      delete this._getLastAttachment().footer;
      return this;
    }

    // attachment message

  }, {
    key: 'defaultFooter',
    value: function defaultFooter() {
      this.footer('Date');
      this.footerValue('ts');
      return this;
    }

    // attachment message

  }, {
    key: 'footer',
    value: function footer(_footer) {
      this._getLastAttachment().footer = _footer;
      return this;
    }

    // attachment message

  }, {
    key: 'footerValue',
    value: function footerValue(_footerValue) {
      if (_footerValue === 'ts') {
        this._getLastAttachment().ts = Math.floor(Date.now() / 1000);
      } else {
        delete this._getLastAttachment().ts;
        this._getLastAttachment().footer += ' | ' + _footerValue;
      }
      return this;
    }
  }, {
    key: 'newAttachment',
    value: function newAttachment(message) {
      this.context._attachments = this.context._attachments || [];
      this.context._attachments.push({
        text: message
      });
      return this;
    }
  }, {
    key: 'useAttachments',
    value: function useAttachments(attachments) {
      this.context._attachments = attachments;
      return this;
    }
  }, {
    key: 'combineAttachments',
    value: function combineAttachments(attachments) {
      this.context._attachments = this.context._attachments || [];
      this.context._attachments = this.context._attachments.concat(attachments);
      return this;
    }

    // global message

  }, {
    key: 'channel',
    value: function channel(_channel) {
      if (_channel.charAt(0) !== '#' && _channel.charAt(0) !== '@') {
        _channel = '#' + _channel;
      }
      this.context._channel = _channel;
      return this;
    }

    // global message

  }, {
    key: 'icon',
    value: function icon(_icon) {
      this.context._icon = _icon;
      return this;
    }

    // global message

  }, {
    key: 'username',
    value: function username(_username) {
      this.context._username = _username;
      return this;
    }
  }, {
    key: '_getLastAttachment',
    value: function _getLastAttachment() {
      if (!this.context._attachments || !this.context._attachments.length) {
        this.context._attachments = [{}];
      }
      return this.context._attachments[this.context._attachments.length - 1];
    }
  }, {
    key: '_initLastField',
    value: function _initLastField() {
      this._getLastAttachment().fields = this._getLastAttachment().fields || [{
        short: true
      }];
    }
  }]);

  return SendConfiguratorPromise;
}();

exports.default = SlackWhSend;