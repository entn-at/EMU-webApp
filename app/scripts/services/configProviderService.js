'use strict';

angular.module('emulvcApp')
	.service('ConfigProviderService', function ConfigProviderService(viewState) {

		// shared service object
		var sServObj = {};
		sServObj.vals = {};
		sServObj.curDbConfig = {};

		/**
		 * depth of 2 = max
		 */
		sServObj.setVals = function (data) {
			if ($.isEmptyObject(sServObj.vals)) {
				sServObj.vals = data;
			} else {
				Object.keys(data).forEach(function (key1) {
					// if array... overwrite entire thing!
					if (angular.isArray(sServObj.vals[key1])) {
						//empty array
						sServObj.vals[key1] = [];
						data[key1].forEach(function (itm) {
							sServObj.vals[key1].push(itm);
						});
					} else {
						Object.keys(data[key1]).forEach(function (key2) {
							if (sServObj.vals[key1][key2] !== undefined) {
								sServObj.vals[key1][key2] = data[key1][key2];
							} else {
								console.error('BAD ENTRY IN CONFIG! Key1: ' + key1 + ' key2: ' + key2);
							}
						});
					}

				});
			}
		};

		/**
		 *
		 */
		sServObj.getSsffTrackConfig = function (name) {
			var res;
			sServObj.curDbConfig.ssffTracks.forEach(function (tr) {
				if (tr.name === name) {
					res = tr;
				}
			})
			return res;
		};

		/**
		 *
		 */
		sServObj.getLimsOfTrack = function (trackName) {
			var res = {};
			sServObj.vals.perspectives[viewState.curPerspectiveIdx].signalCanvases.contourLims.forEach(function (cL) {
				if (cL.ssffTrackName === trackName) {
					res.min = cL.min;
					res.max = cL.max;
				}
			});

			return res;
		};

		return sServObj;

	});