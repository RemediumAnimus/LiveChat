'use strict';

var Jimp = require('jimp');

/**
 * Resize image
 *
 */
var resizeXS = function (tempFilePath, objectName, objectExt){
    const sizeFile      = 196;
    const qualityFile   = 80;
    const nameFile      = objectName+'_196';
    const uploadPath    = 'upload/'+nameFile+objectExt;
    Jimp.read(tempFilePath)
        .then(done => {
            return done
                .resize(sizeFile, Jimp.AUTO)
                //.quality(qualityFile)
                .write(uploadPath);
        })
        .catch(err => {
            console.log(err)
        });
}

/**
 * Resize image
 *
 */
var resizeSM = function (tempFilePath, objectName, objectExt, callback) {
    const sizeFile      = 600;
    const qualityFile   = 100;
    const nameFile      = objectName+'_600';
    const uploadPath    = 'upload/'+nameFile+objectExt;
    Jimp.read(tempFilePath)
        .then(done => {
            return done
                .resize(sizeFile, Jimp.AUTO)
                //.quality(qualityFile)
                .write(uploadPath);
        })
        .catch(err => {
            console.log(err)
        });
}

module.exports = {
    resizeXS,
    resizeSM
};