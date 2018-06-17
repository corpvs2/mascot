const ipcRenderer = window.nodeRequire('electron').ipcRenderer;

ipcRenderer.send("async-request", ["listFromFile",""]);

// メインプロセスから投げられたリクエストがここに来る
ipcRenderer.on('async-request', function(event, arg) {
  if (arg.length != 2){
    console.warn("Invalid format message.");
    return;
  }
  var index = arg[0];
  var argument = arg[1];
  console.log("[IPC-REQUEST] index:", index, ", argument:", argument);

  switch (index) {
  case "listFromDOM":
    ipcRenderer.send('async-reply', [index, getListFromDOM()]);
    break;
  case "transparent":
    if (argument) $("body").css("background-color","rgba(0, 0, 0, 0.0)");
    else $("body").css("background-color","rgba(255, 255, 255, 0.5)");
    break;
  default:
    break;
  }
});

// 投げたリクエストに対するメインプロセスからの応答がここに来る
ipcRenderer.on('async-reply', function(event, arg) {
  if (arg.length != 2){
    console.warn("Invalid format message.");
    return;
  }
  var index = arg[0];
  var responce = arg[1];
  console.log("[IPC-REPLY] index:", index, ", responce:", responce);

  switch (index) {
  case "listFromFile":
    init(responce);
    break;
  default:
    break;
  }
});

// 初期化 IPCから呼ばれる
function init(imgList) {
  if (imgList.length > 1) {
    for (var i=0,img; img=imgList[i]; i++) {
      var image = $("<img>", {
        "src": img["path"],
        "width": img["width"],
        "height": img["height"],
      });

      var frame = $("<div>", {"class": "img-frame"}).css({"top": img["top"], "left": img["left"]});
      frame.append(image);
      $("body").prepend(frame);
    }
  }
  giveImgEvent();
  giveBodyEvent();
}

// DOMを読み込んで画像のリストを返す
function getListFromDOM() {
  var elements = $(".img-frame");
  var list =[];

  for (var i=0; i < elements.length; i++) {
    var el = $(elements[i]);
    var path = $(el.find("img")[0]).attr("src");
    var top = el.offset()["top"];
    var left = el.offset()["left"];
    var width = $(el.children()[0]).width();
    var height = $(el.children()[0]).height();
    list.push({
      "path": path,
      "top": top,
      "left": left,
      "width": width,
      "height": height
    });
  }
  return list;
}

// ファイルがドラッグ&ドロップされた時の画像追加処理
function addImage (path){
  var image = $("<img>").on("load", function() {
    var frame = $("<div>", {"class": "img-frame"});
    frame.append(this);
    $("body").prepend(frame);

    giveImgEvent();
  });
  image.attr("src", path);
}

// 画像をドラッグで移動可能&リサイズ可能にする
function giveImgEvent() {
  $(".img-frame").on("contextmenu", function(e) {
    if (e.ctrlKey) this.remove();
  });
  $(".img-frame").draggable();
  $(".img-frame").children().resizable({"aspectRatio": true, "handles": "se", "autoHide": true});
}

// body部に対するイベント割り当て(主にドラッグ&ドロップ)
function giveBodyEvent() {
  $("body").on("dragover",  function () {
    $("body").css("background-color","rgba(0, 255, 255, 0.5)");
    return false;
  });
  $("body").on("dragleave", function() {
    $("body").css("background-color","rgba(255, 255, 255, 0.5)");
    return false;
  });
  $("body").on("dragend", function () {
    return false;
  });
  $("body").on("drop", function (_e) {
    $("body").css("background-color","rgba(255, 255, 255, 0.5)");
    if( _e.originalEvent ){
      e = _e.originalEvent;
    }
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    if (file.type.indexOf("image/") === 0) {
      addImage(file.path);
    }
    return false;
  });
}
