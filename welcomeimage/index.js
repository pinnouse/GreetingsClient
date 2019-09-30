'use strict';

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');

Vue.component('text-layer-item', {
  template: '\
    <li>\
      <span class="hoverable" @click="$emit(\'edit\')"><b>{{index+1}}:</b> {{ text }}</span>\
      <button class="delete hoverable" @click="$emit(\'remove\', $event)">&times;</button>\
    </li>\
  ',
  props: ['text', 'index']
});

Vue.component('modal', {
  template: '\
  <div class="modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; padding: 0; text-align: center;">\
    <div class="modalBody">\
      {{message}}\
      <br />\
      <button class="close" @click="$emit(\'close\')">Close &times;</button>\
    </div>\
  </div>\
  ',
  props: ['message']
});

var vm = new Vue({
  el: '#editor',
  data: {
    bgSrc: "https://cdn.zerotwo.dev/INTERNAL/GREETING/welcome_blank.png",
    exportSrc: "",
    layers: [
      {
        text: '{{userTag}}',
        textPosition: {
          position: {
            x: 20,
            y: 265
          },
          alignment: "LEFT"
        },
        fontUrl: "Noto",
        fontColor: "#ededdf",
        fontStyle: 0,
        fontSize: 42.0
      },
      {
        text: 'joined the server!',
        textPosition: {
          position: {
            x: 20,
            y: 300
          },
          alignment: "LEFT"
        },
        fontUrl: "Italianate",
        fontColor: "#ededdf",
        fontStyle: 0,
        fontSize: 34.0
      },
      {
        text: '{{members}}',
        textPosition: {
          position: {
            x: 20,
            y: 440
          },
          alignment: "LEFT"
        },
        fontUrl: "Noto",
        fontColor: "#ededdf",
        fontStyle: 1,
        fontSize: 42.0
      },
      {
        text: 'Darlings in the Server <3',
        textPosition: {
          position: {
            x: 20,
            y: 475
          },
          alignment: "LEFT"
        },
        fontUrl: "Noto",
        fontColor: "#ededdf",
        fontStyle: 1,
        fontSize: 36.0
      }
    ],
    avatar: {
      size: 200,
      position: {
        x: 20,
        y: 20
      }
    },
    fonts: [],
    fontData: [],
    activeLayer: 0,
    draggingIndex: -2,
    offset: [],
    modalVisible: false,
    modalMessage: ""
  },
  methods: {
    changeFile(event) {
      if (event.target.files.length <= 0) return;

      let fr = new FileReader();

      fr.addEventListener('load', function () {
        event.target.value = "";
        $('#backgroundPreview').removeClass('noImage');
        vm.bgSrc = fr.result;
      }, false);
      fr.readAsDataURL(event.target.files[0]);
    },
    loadedImage() {
      canvas.width = 1200;
      canvas.height = $('#backgroundPreview').height() * 2;

      ctx.drawImage(img, 0, 0, 1200, $('#backgroundPreview').height() * 2);

      this.exportSrc = canvas.toDataURL();
    },
    addFont(data) {
      if (typeof(data) === "object" && data.target) {
        if (data.target.files.length <= 0 && !/\.ttf$/i.test(data.target.files[0].name)) return;
  
        let fr = new FileReader();
        
        fr.addEventListener('load', function() {
          let fontName = data.target.files[0].name.replace(/\.ttf$/i, "") + "-font";
          data.target.value = "";
          if (vm.fonts.indexOf(fontName) >= 0) {
            vm.showModal('Font with that name already exists.');
            return;
          }
  
          vm.fonts.push(fontName);
          vm.fontData.push({name: fontName, data: fr.result });
          let font = new FontFace(fontName, 'url(' + fr.result + ')');
          font.load().then(function(loadedFont) {
            document.fonts.add(loadedFont);
          }).catch(function(error) {
            console.error(error);
            vm.showModal('Error loading font, please try again.');
          });
        }, false);
        fr.readAsDataURL(event.target.files[0]);
      } else if (typeof(data) === "string" && /^http[s]?/i.test(data)) {
        vm.fonts.push(data);
        vm.fontData.push({name: data, data: data});
        let font = new FontFace(data, 'url(' + data + ')');
        font.load().then(function(loadedFont) {
          document.fonts.add(loadedFont);
        }).catch(function(error) {
          console.error(error);
          vm.showModal('Erorr loading font, please try again.');
        });
      }
    },
    addLayer(e) {
      e.preventDefault();
      if ($('.noImage').length === 0) {
        this.layers.push({
          text: 'New Text Layer...',
          textPosition: {
            position: {
              x: 0,
              y: 36
            },
            alignment: "LEFT"
          },
          fontUrl: fonts[0] || "",
          fontColor: "#ffffff",
          fontStyle: 0,
          fontSize: 36.0
        });
        this.activeLayer = this.layers.length - 1;
      }
    },
    edit(index) {
      this.activeLayer = index;
    },
    remove(e, index) {
      e.preventDefault();
      if (index === this.activeLayer)
        this.activeLayer = -1;
      else if (index < this.activeLayer)
        this.activeLayer -= 1;
      this.layers.splice(index, 1);
    },
    startMove(event, index) {
      event.preventDefault();
      this.activeLayer = this.draggingIndex = index;
      if (index >= 0) {
        this.offset = [
          this.layers[this.draggingIndex].textPosition.position.x - (2 * event.clientX),
          this.layers[this.draggingIndex].textPosition.position.y - (2 * event.clientY)
        ];
      } else if (index === -1) {
          this.offset = [
            this.avatar.position.x - (2 * event.clientX),
            this.avatar.position.y - (2 * event.clientY)
          ];

      }
    },
    move(event) {
      if (this.draggingIndex < this.layers.length && this.draggingIndex >= 0) {
        this.layers[this.draggingIndex].textPosition.position.x = (2 * event.clientX) + this.offset[0];
        this.layers[this.draggingIndex].textPosition.position.y = (2 * event.clientY) + this.offset[1];
      } else if (this.draggingIndex === -1) {
        this.avatar.position.x = (2 * event.clientX) + this.offset[0];
        this.avatar.position.y = (2 * event.clientY) + this.offset[1];
        
      }
    },
    stopMove() {
      this.draggingIndex = -2;
    },
    parseMoustache(text) {
      return text
      .replace(/\{\{(\\s)*members(\\s)*\}\}/gim, '1459')
      .replace(/\{\{(\\s)*userTag(\\s)*\}\}/gim, 'username#0002');
    },
    showModal(message) {
      this.modalMessage = message;
      this.modalVisible = true;
    }
  },
  computed: {
    exportData: function() {
      return {
        width: 1200,
        height: Math.round(canvas.height),
        avatar: this.avatar,
        textPositions: this.layers
      };
    },
    exportFiles: function() {
      return {
        background: this.exportSrc || this.bgSrc,
        fonts: this.fontData
      };

    }
  }
});

$(function () {
  $('.fileButton').click(function () {
    $(`#${$(this).attr('data-button-id')}`).click();
  });

  $('html').keyup(function(e) {
    if (e.code == "Escape") {
      vm.modalVisible = false;
    }
  });
});

function importSettings(str) {
  let importSettings = JSON.parse(str);
  importSettings.textPositions.forEach(layer => {
    if (vm.fonts.indexOf(layer.fontUrl) < 0) {
      vm.addFont(layer.fontUrl);
    }
  });
  vm.bgSrc = importSettings.backgroundUrl;
  vm.avatar = importSettings.avatar;
}

/* Schema:
{
  width: backgroundWidth/int,
  heigth: backgroundHeight/int,
  avatar: {
    size: int,
    position: {
      x: int,
      y: int
    }
  },
  textPositions: [
    {
      text: string,
      textPosition: {
        position: {
          x: int,
          y: int
        },
        alignment: alignment/string (LEFT/CENTER/RIGHT)
      },
      fontUrl: cdnUrl/string,
      fontColor: hexColor/string,
      fontStyle: fontStyle/int (0 plain, 1 bold, 2 italic, 3 both afaik),
      fontSize: float
    }
  ]
}
*/