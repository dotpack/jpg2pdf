$(function () {
    'use strict';

    var maxFileSize = 32 * 1024 * 1024;
    var zone = $('#drop-zone');

    if (typeof(window.FileReader) == 'undefined') {
        zone.html('<p>Не поддерживается браузером!</p>');
        zone.addClass('error');
        return;
    }

    zone[0].ondragover = function () {
        zone.addClass('hover');
        return false;
    };

    zone[0].ondragleave = function () {
        zone.removeClass('hover');
        return false;
    };

    zone[0].ondrop = function (event) {
        event.preventDefault();
        zone.removeClass('hover');
        zone.addClass('drop');

        var fileList = event.dataTransfer.files;
        var fileKeys = Object.keys(event.dataTransfer.files);
        var formData = new FormData();

        var size = 0;
        fileKeys.forEach(function (key) {
            size += fileList[key].size;
            formData.append('images', fileList[key]);
        });

        if (size > maxFileSize) {
            zone.html('<p>Файлы слишком большые!</p>');
            zone.removeClass('drop').addClass('error');
            return false;
        }

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', uploadProgress, false);
        xhr.onreadystatechange = stateChange;
        xhr.open('POST', '/upload');
        xhr.send(formData);
    };

    function uploadProgress(event) {
        var percent = parseInt(event.loaded / event.total * 100);
        zone.html('<p>Загрузка: ' + percent + '%</p>');
    }

    function stateChange(event) {
        if (event.target.readyState == 4) {
            if (event.target.status == 200) {
                var result = JSON.parse(this.responseText);
                var href = (result && result.data && result.data.uuid) ? '</p><p><a href="download/' + result.data.uuid + '" target="_blank" onclick="$(this).remove()">Скачать PDF</a>' : ''
                zone.html('<p>Загрузка успешно завершена!' + href + '</p>');
            } else {
                zone.html('<p>Произошла ошибка!</p>');
                zone.removeClass('drop').addClass('error');
            }
        }
    }
});
