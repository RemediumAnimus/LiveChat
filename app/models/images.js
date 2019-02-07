'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const Jimp = require('jimp');

/**
 * TITLE        : Images method
 * DESCRIPTION  : Resize image (196x196)
 *
 */
const resizeXS = function (tempFilePath, objectRoom, objectName, objectExt, callback){
    const sizeFile      = 196;
    const qualityFile   = 80;
    const nameFile      = objectName+'_196';
    const uploadPath    = 'upload/'+objectRoom+'/'+nameFile+objectExt;

    Jimp.read(tempFilePath)
        .then(done => {
            return done
                .resize(sizeFile, Jimp.AUTO)
                .quality(qualityFile)
                .write(uploadPath, callback(null, uploadPath));
        })
        .catch(err => {
            callback(err, null)
        });
}

/**
 * TITLE        : Images method
 * DESCRIPTION  : Resize image (600x600)
 *
 */
const resizeSM = function (tempFilePath, objectRoom, objectName, objectExt, callback) {
    const sizeFile      = 600;
    const qualityFile   = 100;
    const nameFile      = objectName+'_600';
    const uploadPath    = 'upload/'+objectRoom+'/'+nameFile+objectExt;
    Jimp.read(tempFilePath)
        .then(done => {
            return done
                .resize(sizeFile, Jimp.AUTO)
                .quality(qualityFile)
                .write(uploadPath, callback(null, uploadPath));
        })
        .catch(err => {
            callback(err, null)
        });
}

module.exports = {
    resizeXS,
    resizeSM
};