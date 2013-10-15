'use strict';

var MainCtrl = angular.module('emulvcApp')
	.controller('MainCtrl', function($scope, $modal, $log, $http,
		viewState, Iohandlerservice, Soundhandlerservice, Colorproviderservice) {

		$scope.lastkeycode = "N/A";

		// init load of config files
		Colorproviderservice.httpGetDrawingColorsConfig();

		// move out of controller...
		// get keyboard shortcut mappings
		$http.get('configFiles/keyboardShortcuts.json').success(function(data) {
			$scope.keyMappings = data;
		});


		// init loading of files for testing
		Iohandlerservice.httpGetLabelJson();
		Iohandlerservice.httpGetAudioFile();
		Iohandlerservice.httpGetSSFFfile('testData/msajc003.fms');

		/**
		 * listen for newlyLoadedAudioFile
		 */
		$scope.$on('newlyLoadedAudioFile', function(evt, data) {
			Soundhandlerservice.decodeAudioFile(data, function(d) {
				viewState.curViewPort.bufferLength = d.length;
				$scope.$digest(); // To update changed var... don't know if this is the way to do it... but it seems to be needed
			});
		});

		$scope.openModal = function(templatefile, cssStyle, title, content) {
			var modalInstance = $modal.open({
				backdrop: true,
				keyboard: true,
				backdropClick: true,
				templateUrl: templatefile,
				windowClass: cssStyle,
				controller: 'ModalInstanceCtrl',
				resolve: {
					modalContent: function() {
						return content;
					},
					modalTitle: function() {
						return title;
					}
				}
			});
		};

		$scope.setlastkeycode = function(c, shift) {
			$scope.lastkeycode = c;
		};

	});


var ModalInstanceCtrl = function($scope, $modalInstance, modalTitle, modalContent) {

	$scope.modalContent = modalContent;
	$scope.modalTitle = modalTitle;

	$scope.ok = function() {
		//$modalInstance.close($scope.selected.item);
		$modalInstance.dismiss('cancel');
	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};

	$scope.deleteSegment = function() {
		alert(modalTitle);
	};

	$scope.deleteTier = function() {
		alert(modalTitle);
	};
};