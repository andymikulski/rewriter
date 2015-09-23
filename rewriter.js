/*!
 * Rewriter 0.1
 * @author Andy Mikulski <github.com/andymikulski>
 * @url https://github.com/andymikulski/rewriter
 */

;
(function($, window, document, undefined) {
  var Rewriter = function(options) {
    options = options || {};

    // DOM PREPARATION ---------

    var rewriterStyles = {
      'body': {
        '&.is-rw-editing': {
          '.rw-auth-panel': {
            display: 'block'
          },
          '&': {
            '[data-cms]': {
              outline: '1px dotted rgba(255,255,255,0.8)',
              cursor: 'pointer',
              '&:focus': {
                cursor: 'auto'
              }
            }
          }
        },
        '&.rw-request-auth': {
          '.rw-auth-modal': {
            display: 'block'
          },
          '.rw-auth-dim': {
            display: 'block'
          }
        }
      },
      '[data-cms]': {
        opacity: 0,
        transition: '2s opacity ease 0.1s',
        '&.is-ready': {
          opacity: 1
        }
      },

      '.rw-auth-dim': {
        '&': {
          display: 'none',
          position: 'fixed',
          'top': 0,
          'right': 0,
          'left': 0,
          'bottom': 0,
          'height': '100%',
          'width': '100%',
          'z-index': 9,
          'background': 'rgba(0,0,0,0.9)'
        }
      },
      '.rw-auth-modal': {
        '&': {
          display: 'none',
          position: 'fixed',
          'top': '50%',
          'left': '50%',
          'transform': 'translateY(-50%) translateX(-50%)',
          'z-index': 10
        },
        'input': {
          'margin-bottom': '1em',
          'padding': '0 0.5em',
          '&[type="submit"]': {
            'margin-right': '1em'
          }
        }
      },

      '.rw-auth-panel': {
        '&': {
          'display': 'none',
          'position': 'fixed',
          'top': '0',
          'width': '100%',
          'height': '7vh',
          'min-height': '60px',
          'background-color': 'rgba(0,0,0,0.8)',
          'padding-top': '1em',
          'text-align': 'center'
        },
        'li': {
          display: 'inline-block'
        }
      },
      '.rw-auth-item-panel': {
        '&': {
          'display': 'none'
        },
        'li': {
          display: 'inline-block'
        }
      }
    };

    var $authModal = $(Rebar.div(
      Rebar.div({
          className: 'rw-auth-modal'
        },
        Rebar.h1('Log in to Rewriter CMS'),
        Rebar.form(
          Rebar.span('Username'),
          Rebar.input({
            type: 'text',
            name: 'required-username',
            required: 'required',
            ref: 'txtUser'
          }),
          Rebar.span('Password'),
          Rebar.input({
            type: 'password',
            name: 'required-pass',
            ref: 'txtPass'
          }),
          Rebar.input({
            type: 'submit',
            value: 'Log in',
            ref: 'btnLogin'
          }),
          Rebar.input({
            type: 'button',
            value: 'Cancel',
            ref: 'btnCancel'
          })
        )),
      Rebar.div({
        className: 'rw-auth-dim',
        ref: 'dim'
      })
    ));

    var itemControls = {
      'Save': 'btnSave',
      'Undo': 'btnUndo'
    };

    var $itemPanel = $(Rebar.div(
      Rebar.div({
        className: 'rw-auth-item-panel'
      }, Rebar.ul(
        (function() {
          var list = '';
          for (var fnName in itemControls) {
            list = list + Rebar.li({
              ref: itemControls[fnName]
            }, fnName);
          }
          return list;
        })()
      ))
    ));

    var cmsControls = {
      'Toggle Editable Content': 'btnToggle'
    };

    var $authPanel = $(Rebar.div(
      Rebar.div({
        className: 'rw-auth-panel'
      }, Rebar.div('Double click text to enable editing. Changes are saved automatically when you finish editing a section.'))
      // Rebar.div({
      //   className: 'rw-auth-panel'
      // }, Rebar.ul(
      //   (function() {
      //     var list = '';
      //     for (var fnName in cmsControls) {
      //       list = list + Rebar.li({
      //         ref: cmsControls[fnName]
      //       }, fnName);
      //     }
      //     return list;
      //   })()
      // ))
    ));

    // Establish necessary styles
    var stiles = new Stiles(rewriterStyles);

    var refs = {
      'authModal': $authModal,
      'authPanel': $authPanel,
      'itemPanel': $itemPanel
    };

    for (var instance in refs) {
      $(document.body).append(refs[instance]);

      var $v, vRef;
      refs[instance].find('[ref]').each(function(i, v) {
        $v = $(v);
        vRef = $v.attr('ref');
        if (vRef && vRef !== '') {
          refs[instance][vRef] = $v;
        }
      });
    }

    // END DOM PREPARATION ---------

    var exports = {
      //
      // MEMORY
      //
      'requests': {
        'loads': {},
        'saves': {}
      },

      //
      // AUTHORIZATION ------------
      //
      'crypto': function(p) {
        var h = function(a, b) {
            var d, c, e, f, g;
            e = a & 2147483648;
            f = b & 2147483648;
            d = a & 1073741824;
            c = b & 1073741824;
            g = (a & 1073741823) + (b & 1073741823);
            return d & c ? g ^ 2147483648 ^ e ^ f : d | c ? g & 1073741824 ? g ^ 3221225472 ^ e ^ f : g ^ 1073741824 ^ e ^ f : g ^ e ^ f
          },
          k = function(a, b, d, c, e, f, g) {
            a = h(a, h(h(b & d | ~b & c, e), g));
            return h(a << f | a >>> 32 - f, b)
          },
          l = function(a, b, d, c, e, f, g) {
            a = h(a, h(h(b & c | d & ~c, e), g));
            return h(a << f | a >>> 32 - f, b)
          },
          m = function(a, b, c, d, f, e, g) {
            a = h(a, h(h(b ^ c ^ d, f), g));
            return h(a << e | a >>> 32 - e, b)
          },
          n = function(a, b, c, d, e, f, g) {
            a = h(a,
              h(h(c ^ (b | ~d), e), g));
            return h(a << f | a >>> 32 - f, b)
          },
          q = function(a) {
            var b = "",
              c = "",
              d;
            for (d = 0; 3 >= d; d++) c = a >>> 8 * d & 255, c = "0" + c.toString(16), b += c.substr(c.length - 2, 2);
            return b
          },
          f = [],
          e, r, t, u, v, a, b, d, c;
        p = function(a) {
          if (null === a || "undefined" === typeof a) return "";
          a += "";
          var b = "",
            c, d, f = 0;
          c = d = 0;
          for (var f = a.length, e = 0; e < f; e++) {
            var g = a.charCodeAt(e),
              h = null;
            if (128 > g) d++;
            else if (127 < g && 2048 > g) h = String.fromCharCode(g >> 6 | 192, g & 63 | 128);
            else if (55296 != (g & 63488)) h = String.fromCharCode(g >> 12 | 224, g >> 6 & 63 | 128, g & 63 | 128);
            else {
              if (55296 !=
                (g & 64512)) throw new RangeError("Unmatched trail surrogate at " + e);
              h = a.charCodeAt(++e);
              if (56320 != (h & 64512)) throw new RangeError("Unmatched lead surrogate at " + (e - 1));
              g = ((g & 1023) << 10) + (h & 1023) + 65536;
              h = String.fromCharCode(g >> 18 | 240, g >> 12 & 63 | 128, g >> 6 & 63 | 128, g & 63 | 128)
            }
            null !== h && (d > c && (b += a.slice(c, d)), b += h, c = d = e + 1)
          }
          d > c && (b += a.slice(c, f));
          return b
        }(p);
        f = function(a) {
          var b, c = a.length;
          b = c + 8;
          for (var d = 16 * ((b - b % 64) / 64 + 1), e = Array(d - 1), f = 0, g = 0; g < c;) b = (g - g % 4) / 4, f = g % 4 * 8, e[b] |= a.charCodeAt(g) << f, g++;
          b = (g - g % 4) / 4;
          e[b] |= 128 << g % 4 * 8;
          e[d - 2] = c << 3;
          e[d - 1] = c >>> 29;
          return e
        }(p);
        a = 1732584193;
        b = 4023233417;
        d = 2562383102;
        c = 271733878;
        p = f.length;
        for (e = 0; e < p; e += 16) r = a, t = b, u = d, v = c, a = k(a, b, d, c, f[e + 0], 7, 3614090360), c = k(c, a, b, d, f[e + 1], 12, 3905402710), d = k(d, c, a, b, f[e + 2], 17, 606105819), b = k(b, d, c, a, f[e + 3], 22, 3250441966), a = k(a, b, d, c, f[e + 4], 7, 4118548399), c = k(c, a, b, d, f[e + 5], 12, 1200080426), d = k(d, c, a, b, f[e + 6], 17, 2821735955), b = k(b, d, c, a, f[e + 7], 22, 4249261313), a = k(a, b, d, c, f[e + 8], 7, 1770035416), c = k(c, a, b, d, f[e + 9], 12, 2336552879), d = k(d, c, a, b, f[e +
            10], 17, 4294925233), b = k(b, d, c, a, f[e + 11], 22, 2304563134), a = k(a, b, d, c, f[e + 12], 7, 1804603682), c = k(c, a, b, d, f[e + 13], 12, 4254626195), d = k(d, c, a, b, f[e + 14], 17, 2792965006), b = k(b, d, c, a, f[e + 15], 22, 1236535329), a = l(a, b, d, c, f[e + 1], 5, 4129170786), c = l(c, a, b, d, f[e + 6], 9, 3225465664), d = l(d, c, a, b, f[e + 11], 14, 643717713), b = l(b, d, c, a, f[e + 0], 20, 3921069994), a = l(a, b, d, c, f[e + 5], 5, 3593408605), c = l(c, a, b, d, f[e + 10], 9, 38016083), d = l(d, c, a, b, f[e + 15], 14, 3634488961), b = l(b, d, c, a, f[e + 4], 20, 3889429448), a = l(a, b, d, c, f[e + 9], 5, 568446438), c = l(c, a,
            b, d, f[e + 14], 9, 3275163606), d = l(d, c, a, b, f[e + 3], 14, 4107603335), b = l(b, d, c, a, f[e + 8], 20, 1163531501), a = l(a, b, d, c, f[e + 13], 5, 2850285829), c = l(c, a, b, d, f[e + 2], 9, 4243563512), d = l(d, c, a, b, f[e + 7], 14, 1735328473), b = l(b, d, c, a, f[e + 12], 20, 2368359562), a = m(a, b, d, c, f[e + 5], 4, 4294588738), c = m(c, a, b, d, f[e + 8], 11, 2272392833), d = m(d, c, a, b, f[e + 11], 16, 1839030562), b = m(b, d, c, a, f[e + 14], 23, 4259657740), a = m(a, b, d, c, f[e + 1], 4, 2763975236), c = m(c, a, b, d, f[e + 4], 11, 1272893353), d = m(d, c, a, b, f[e + 7], 16, 4139469664), b = m(b, d, c, a, f[e + 10], 23, 3200236656),
          a = m(a, b, d, c, f[e + 13], 4, 681279174), c = m(c, a, b, d, f[e + 0], 11, 3936430074), d = m(d, c, a, b, f[e + 3], 16, 3572445317), b = m(b, d, c, a, f[e + 6], 23, 76029189), a = m(a, b, d, c, f[e + 9], 4, 3654602809), c = m(c, a, b, d, f[e + 12], 11, 3873151461), d = m(d, c, a, b, f[e + 15], 16, 530742520), b = m(b, d, c, a, f[e + 2], 23, 3299628645), a = n(a, b, d, c, f[e + 0], 6, 4096336452), c = n(c, a, b, d, f[e + 7], 10, 1126891415), d = n(d, c, a, b, f[e + 14], 15, 2878612391), b = n(b, d, c, a, f[e + 5], 21, 4237533241), a = n(a, b, d, c, f[e + 12], 6, 1700485571), c = n(c, a, b, d, f[e + 3], 10, 2399980690), d = n(d, c, a, b, f[e + 10], 15, 4293915773),
          b = n(b, d, c, a, f[e + 1], 21, 2240044497), a = n(a, b, d, c, f[e + 8], 6, 1873313359), c = n(c, a, b, d, f[e + 15], 10, 4264355552), d = n(d, c, a, b, f[e + 6], 15, 2734768916), b = n(b, d, c, a, f[e + 13], 21, 1309151649), a = n(a, b, d, c, f[e + 4], 6, 4149444226), c = n(c, a, b, d, f[e + 11], 10, 3174756917), d = n(d, c, a, b, f[e + 2], 15, 718787259), b = n(b, d, c, a, f[e + 9], 21, 3951481745), a = h(a, r), b = h(b, t), d = h(d, u), c = h(c, v);
        return (q(a) + q(b) + q(d) + q(c)).toLowerCase()
      },

      '_needsAuth': (options.hasOwnProperty('requireAuth') ? options.requireAuth : true),
      '_hasAuth': (options.hasOwnProperty('requireAuth') ? !options.requireAuth : false),
      'isReady': function() {
        var self = this;
        return self._hasAuth;
      },
      'declineAuth': function() {
        var self = this,
          $body = $(document.body);

        $body.removeClass('rw-request-auth is-rw-editing');

        self._clearAuthFields();

        return self;
      },
      'acceptAuth': function() {
        var self = this,
          $body = $(document.body);

        alert('Welcome!');

        $body.addClass('is-rw-editing').removeClass('rw-request-auth');

        self._clearAuthFields();

        return self;
      },
      '_clearAuthFields': function() {
        var self = this;
        refs.authModal.txtUser.val('');
        refs.authModal.txtPass.val('');
      },
      'getAuthentication': function() {
        var self = this;
        self._hasAuth = true;

        $(document.body).addClass('rw-request-auth');

        return self._hasAuth;
      },

      'onAuthSubmit': function(evt) {
        evt && evt.preventDefault && evt.preventDefault();
        var self = this,
          $target = $(evt.currentTarget),
          formData = $target.closest('form').serializeArray(),
          isValid = true,
          field;

        for (var i = 0; i < formData.length; i++) {
          var currentField = formData[i],
            fieldName = currentField.name,
            fieldVal = currentField.value,
            isRequired = fieldName.indexOf('required-') === 0;

          if (isRequired || fieldVal !== '') {
            fieldName = fieldName.replace('required-', '');

            var rwAuthProp = window.rw[fieldName];

            if (rwAuthProp && rwAuthProp !== '') {
              var cryptoVal = self.crypto(fieldVal);

              if (cryptoVal !== rwAuthProp) {
                isValid = false;
              }
            }
          }
        }

        if (isValid) {
          self.acceptAuth();
        } else {
          alert('Invalid login credentials, try again');
        }
      },

      //
      // FIELD PREP
      //
      '_findAndBind': function($container) {
        var self = this;
        if (!$container) {
          $container = $(document.body);
        } else if (!($container instanceof $)) {
          $container = $($container);
        }

        self._findFields($container).each(function(i, v) {
          self._bindField($(v));
        });
      },

      '_findFields': function($container) {
        var self = this,
          $fields = $container.find('[data-cms]');

        return $fields;
      },

      '_bindField': function($field) {
        var self = this,
          actions = {
            'click': self._onFieldFocus.bind(self),
            'blur': self._onFieldBlur.bind(self)
          };

        // see if there's anything to load
        self._requestLoad(self.getPath($field), function() {
          setTimeout(function() {
            $field.addClass('is-ready');
          }, 150);
        });

        for (var key in actions) {
          $field.on(key,
            // IIFE to preserve the key/field
            (function(key, $field) {
              return function(evt) {
                if (!self.isReady()) {
                  return;
                }
                evt && evt.preventDefault && evt.preventDefault();

                return actions[key]($field);
              }
            }(key, $field))
            // </IIFE>
          );
        }
      },

      //
      // FIELD ACTIONS
      //
      '_onFieldFocus': function($field) {
        var self = this,
          hasAttr = $field.attr('contenteditable');

        $field.data('rw-before', $field.html());

        $field.attr('contenteditable', true);
      },

      '_onFieldBlur': function($field) {
        var self = this;

        if ($field.html() !== $field.data('rw-before')) {
          $field.attr('is-rw-dirty', true);

          if (window.confirm('Save changes?')) {
            self.requestFieldSave($field);
            $field.data('rw-before', '');
          } else {
            $field.html($field.data('rw-before'));
            $field.data('rw-before', '');
          }
        } else {
          $field.attr('is-rw-dirty', false);
        }

        $field.attr('contenteditable', false);
      },

      'requestFieldSave': function($field) {
        var self = this,
          fieldID = self.getPath($field),
          fieldContent = $field.html();

        // remove the attributes we dont want, e.g. contenteditable="true"
        fieldContent = fieldContent.replace(/contenteditable="true"/gi, '');

        self._requestSave(fieldID, fieldContent);
      },

      //
      // API REQUESTS
      //
      '_requestSave': function(fieldID, fieldContent) {
        var self = this,
          saves = self.requests.saves;

        // if we already have a save pending for this field,
        // cancel it
        if (saves.hasOwnProperty(fieldID)) {
          saves[fieldID].abort && saves[fieldID].abort();
        }

        saves[fieldID] = $.ajax({
          'url': 'cms.php',
          'type': 'post',
          'data': {
            'action': 'save',
            'id': fieldID,
            'text': fieldContent
          },
          'success': function() {

            // clear the saves field for this request
            saves[fieldID] = null;
            delete saves[fieldID];
          },
          'error': function() {}
        });
      },

      '_requestLoad': function(fieldID, cb) {
        var self = this,
          loads = self.requests.loads;

        // if we already have a load pending for this field,
        // we dont need to do anything, it's already been requested
        if (loads.hasOwnProperty(fieldID) && loads[fieldID].abort) {
          return;
        }

        // make the cms request
        loads[fieldID] = $.ajax({
          'url': 'cms.php',
          'type': 'post',
          'data': {
            'action': 'load',
            'id': fieldID
          },
          'success': function(fieldContent) {
            if (fieldContent && fieldContent !== '') {
              // replace the field with the loaded content
              $(fieldID).html(fieldContent);
            }

            // clear the loads field for this request
            loads[fieldID] = null;
            delete loads[fieldID];

            cb && cb();
          },
          'error': function() {
            cb && cb();
          }
        });
      },

      //
      // UTIL
      //

      // gets an absolute path selector for provided jquery element
      'getPath': function($element) {
        if ($element.length != 1) throw 'Requires one element.';

        var path, node = $element;
        while (node.length) {
          var realNode = node[0],
            name = realNode.localName;
          if (!name) break;
          name = name.toLowerCase();

          var parent = node.parent();

          var siblings = parent.children(name);
          if (siblings.length > 1) {
            name += ':eq(' + siblings.index(realNode) + ')';
          }

          path = name + (path ? ' > ' + path : '');
          node = parent;
        }

        return path;
      },



      //
      // PANEL FUNCTIONS
      //

      'toggleEditable': function(yesno) {
        var self = this,
          $body = $(document.body);

        $body[yesno ? 'addClass' : 'removeClass']('show-rw-cms');
      },

      'saveField': function($field) {
        var self = this;

        self.requestFieldSave($field);

        $field.attr('contenteditable', false).attr('is-rw-dirty', false);

      }
    };

    // INIT--------

    exports.init = function() {
      var self = this;

      exports._findAndBind();
      refs.authModal.btnLogin.unbind().on('click', exports.onAuthSubmit.bind(exports));
      refs.authModal.btnCancel.unbind().on('click', exports.declineAuth.bind(exports));
      refs.authModal.dim.unbind().on('click', exports.declineAuth.bind(exports));
    };

    if (!options.hasOwnProperty('preventInit') || !options.preventInit) {
      exports.init();
    }

    return exports;
  };

  return (window.Rewriter = new Rewriter());
})(jQuery, window, document);