'use strict';

angular.module('emulvcApp')
	.controller('MainCtrl', function ($scope, $modal, $log, $compile, $timeout, $window,
		viewState, HistoryService, Iohandlerservice, Soundhandlerservice, ConfigProviderService, fontScaleService, Ssffdataservice, Tierdataservice, dialogService) {

		$scope.cps = ConfigProviderService;
		$scope.history = HistoryService;
		$scope.fontImage = fontScaleService;
		$scope.tds = Tierdataservice;
		$scope.vs = viewState;
		$scope.connectBtnLabel = 'connect';
		$scope.tmp = {};
		$scope.tmp.showSaveCommStaBtnDiv = false;
		$scope.showDropZone = false;
		$scope.dbLoaded = false;

		$scope.lastkeycode = 'N/A';
		$scope.uttList = [];

		$scope.showDropZone = true;

		$scope.curUserName = '';
		$scope.curUtt = {};
		$scope.modifiedCurTierItems = false;
		$scope.modifiedCurSSFF = false;
		$scope.modifiedMetaData = false;
		$scope.lastclickedutt = null;
		$scope.shortcut = null;

		$scope.windowWidth = $window.outerWidth;
		angular.element($window).bind('resize', function () {
			$scope.refreshTimeline();
			$('#HandletiersCtrl').scope().deleteEditArea();
			$scope.windowWidth = $window.outerWidth;
			$scope.$apply('windowWidth');
		});

		angular.element($window).bind('keyup', function (e) {
			if (e.keyCode === ConfigProviderService.vals.keyMappings.shift) {
				HistoryService.history();
			}
			if (e.keyCode === ConfigProviderService.vals.keyMappings.alt) {
				HistoryService.history();
			}
		});

		// init load of config files
		ConfigProviderService.httpGetConfig();

		// init history service

		// HAS TO BE DONE WHEN NEW UTT DATA ARE READY !! TODO !!
		$scope.history.init();

		// init pure jquery dragbar
		$('.TimelineCtrl').ownResize('.resizer');

		/**
		 * listen for configLoaded
		 */
		$scope.$on('configLoaded', function () {
			$scope.handleConfigLoaded();
		});


		/**
		 * listen for connectedToWSserver
		 */
		$scope.$on('connectedToWSserver', function () {
			// TODO hardcode removal of save / load/ manipulation buttons 
			$scope.showDropZone = false;
			ConfigProviderService.vals.main.comMode = 'ws';
			$scope.showSaveCommStaBtnDiv = true; // SIC should not hardcode... should check if in json 

			// Check if server speaks emuLVC
			Iohandlerservice.wsH.getProtocol().then(function (res) {
				if (res.protocol === 'emuLVC-websocket-protocol' && res.version === '0.0.1') {
					//console.log('we speak the same protocol!!');
					Iohandlerservice.wsH.getConfigFile().then(function (newVal) {
						ConfigProviderService.setVals(newVal);
					});
					if (!ConfigProviderService.vals.main.autoConnect) {
						Iohandlerservice.wsH.getDoUserManagement().then(function (manageRes) {
							if (manageRes === 'YES') {
								dialogService.open('views/login.html', 'LoginCtrl');
								// Iohandlerservice.wsH.getUsrUttList('florian');
							} else {
								$scope.$broadcast('newUserLoggedOn', '');
							}
						});
					} else {
						$scope.connectBtnLabel = 'disconnect';
						$scope.$broadcast('newUserLoggedOn', '');

					}
				} else {
					// disconnect from server and reopen connect dialog

				}
			});
		});

		/**
		 * listen for dropped files
		 */
		// $scope.$on('fileLoaded', function (evt, type, data) {
		// 	switch (type) {
		// 	case type.WAV:
		// 		$scope.uttList[0].name = data.name.substr(0, data.name.lastIndexOf('.'));
		// 		Iohandlerservice.httpGetUtterence($scope.uttList[0], 'testData/' + $scope.uttList[0] + '/');
		// 		break;
		// 	case type.TEXTGRID:

		// 		break;
		// 	}
		// 	console.log('data');
		// 	console.log(data);
		// });

		/**
		 * listen for newlyLoadedUttList
		 */
		// $scope.$on('newlyLoadedUttList', function(evt, uttList) {
		// 	$scope.uttList = uttList;
		// 	// Iohandlerservice.httpGetUtterence($scope.uttList[0]);
		// 	$scope.curUtt = $scope.uttList[0];
		// 	if (!viewState.getsubmenuOpen()) {
		// 		$scope.openSubmenu();
		// 	}
		// });

		/**
		 * listen for newUserLoggedOn (also called for no user on auto connect)
		 */
		$scope.$on('newUserLoggedOn', function (evt, name) {
			$scope.curUserName = name;
			viewState.setState('loadingSaving');
			Iohandlerservice.wsH.getUsrUttList(name).then(function (newVal) {
				Iohandlerservice.getUtt(newVal[0]);
				// should have then from getUtt
				viewState.setState('labeling');
				$scope.curUtt = newVal[0];
				if (!viewState.getsubmenuOpen()) {
					$scope.openSubmenu();
				}
				$scope.uttList = newVal;
				$scope.curUtt = newVal[0];
			});
		});


		/**
		 * listen for saveSSFFb4load
		 */
		$scope.$on('saveSSFFb4load', function () {
			console.log('saving utt');
			// Iohandlerservice.postSaveSSFF();
			Iohandlerservice.wsH.saveSSFFfile($scope.curUserName, Ssffdataservice.data[0]); // SIC hardcoded
			$scope.modifiedCurSSFF = false;
			$scope.$broadcast('loadingNewUtt');
			console.log($scope.lastclickedutt);
			// Iohandlerservice.httpGetUtterence($scope.lastclickedutt);
			Iohandlerservice.wsH.getUtt($scope.curUserName, $scope.lastclickedutt);
			$scope.curUtt = $scope.lastclickedutt;
		});

		/**
		 * listen for saveSSFFb4load
		 */
		$scope.$on('discardSSFFb4load', function () {
			console.log('discarding ssff changes');
			$scope.modifiedCurSSFF = false;
			$scope.$broadcast('loadingNewUtt');
			console.log($scope.lastclickedutt);
			// Iohandlerservice.httpGetUtterence($scope.lastclickedutt);
			Iohandlerservice.wsH.getUtt($scope.curUserName, $scope.lastclickedutt);
			$scope.curUtt = $scope.lastclickedutt;
		});

		// /**
		//  * listen for newlyLoadedAudioFile
		//  */
		// $scope.$on('newlyLoadedAudioFile', function (evt, wavJSO, fileName) {
		// 	// for dev:
		// 	// viewState.curViewPort.sS = 28234;
		// 	// viewState.curViewPort.eS = 28570;
		// 	viewState.curViewPort.sS = 0;
		// 	viewState.curViewPort.eS = wavJSO.Data.length;
		// 	viewState.curViewPort.bufferLength = wavJSO.Data.length;
		// 	viewState.setscrollOpen(0);
		// 	Soundhandlerservice.wavJSO = wavJSO;
		// 	$scope.baseName = fileName.substr(0, fileName.lastIndexOf('.'));
		// });

		// 
		$scope.handleConfigLoaded = function () {

			// for development
			if (!viewState.getsubmenuOpen()) {
				$scope.openSubmenu();
			}
			// for development
			$scope.openDemoDBbtnClick();

			$scope.shortcut = Object.create(ConfigProviderService.vals.keyMappings);
			// convert int values to char for front end
			for (var i in $scope.shortcut) {
				// sonderzeichen space
				if ($scope.shortcut[i] === 8) {
					$scope.shortcut[i] = 'BACKSPACE';
				} else if ($scope.shortcut[i] === 9) {
					$scope.shortcut[i] = 'TAB';
				} else if ($scope.shortcut[i] === 13) {
					$scope.shortcut[i] = 'ENTER';
				} else if ($scope.shortcut[i] === 16) {
					$scope.shortcut[i] = 'SHIFT';
				} else if ($scope.shortcut[i] === 18) {
					$scope.shortcut[i] = 'ALT';
				} else if ($scope.shortcut[i] === 27) {
					$scope.shortcut[i] = 'ESC';
				} else if ($scope.shortcut[i] === 32) {
					$scope.shortcut[i] = 'SPACE';
				} else if ($scope.shortcut[i] === -1) {
					$scope.shortcut[i] = 'NONE';
				} else if ($scope.shortcut[i] === 38) {
					$scope.shortcut[i] = 'ARROW UP';
				} else if ($scope.shortcut[i] === 40) {
					$scope.shortcut[i] = 'ARROW DOWN';
				} else if ($scope.shortcut[i] === 187) {
					$scope.shortcut[i] = '+';
				} else if ($scope.shortcut[i] === 189) {
					$scope.shortcut[i] = '-';
				} else {
					$scope.shortcut[i.toString()] = String.fromCharCode($scope.shortcut[i]);

				}
			}

			if (ConfigProviderService.vals.main.autoConnect) {
				// console.log("DEVEL");
				Iohandlerservice.wsH.initConnect(ConfigProviderService.vals.main.wsServerUrl);
			}

			// init loading of files for testing
			viewState.setspectroSettings(ConfigProviderService.vals.spectrogramSettings.N,
				ConfigProviderService.vals.spectrogramSettings.rangeFrom,
				ConfigProviderService.vals.spectrogramSettings.rangeTo,
				ConfigProviderService.vals.spectrogramSettings.dynamicRange,
				ConfigProviderService.vals.spectrogramSettings.window);

			// set timeline height according to config settings "colors.timelineHeight"
			$('.TimelineCtrl').css('height', ConfigProviderService.vals.colors.timelineHeight);
			$('.HandletiersCtrl').css('padding-top', $('.TimelineCtrl').height() + 2 * $('.menu').height() + 'px');

			// setting transition values
			var dotMs = ConfigProviderService.vals.colors.transitionTime / 1000;
			var transcss = {
				'-webkit-transition': 'width ' + dotMs + 's ease-in-out, left ' + dotMs + 's ease-in-out',
				'-moz-transition': 'width ' + dotMs + 's ease-in-out, left ' + dotMs + 's ease-in-out',
				'-ms-transition': 'width ' + dotMs + 's ease-in-out, left ' + dotMs + 's ease-in-out',
				'-o-transition': 'width ' + dotMs + 's ease-in-out, left ' + dotMs + 's ease-in-out',
				'transition': 'width ' + dotMs + 's ease-in-out, left ' + dotMs + 's ease-in-out'
			};
			$('.menu').css(transcss);
			$('.HandletiersCtrl').css(transcss);
			$('.OsciDiv').css(transcss);
			$('.SpectroDiv').css(transcss);
			$('.menu-bottom').css(transcss);
			$('.cbp-spmenu').css(transcss);
			$('.cbp-spmenu-push').css(transcss);
			$('.cbp-spmenu-push-toleft').css(transcss);
			$('.cbp-spmenu-push-toright').css(transcss);



			if (ConfigProviderService.vals.restrictions.sortLabels) {
				// $('#allowSortable').sortable('enable');
			}

			// connect to ws server if it says so in config
			// if (ConfigProviderService.vals.main.mode === 'server' && ConfigProviderService.vals.main.wsServerUrl !== undefined) {
			// 	Iohandlerservice.wsH.initConnect(ConfigProviderService.vals.main.wsServerUrl);
			// }

			// swap osci and spectro depending on config settings "signalsCanvasConfig.order"
			$('#' + ConfigProviderService.vals.signalsCanvasConfig.order[1]).insertBefore('#' + ConfigProviderService.vals.signalsCanvasConfig.order[0]);
			$('#' + ConfigProviderService.vals.signalsCanvasConfig.order[0]).insertBefore('#' + ConfigProviderService.vals.signalsCanvasConfig.order[1]);

		};


		$scope.downloadTextGrid = function () {
			console.log(Iohandlerservice.toTextGrid());
		};

		$scope.refreshTimeline = function () {
			$scope.$broadcast('refreshTimeline');
		};

		$scope.refreshScope = function () {
			$scope.$digest();
		};

		$scope.getShortCut = function (name) {
			if ($scope.shortcut !== null) {
				if ($scope.shortcut[name] !== null) {
					if ($scope.shortcut[name] !== '') {
						return $scope.shortcut[name];
					} else {
						return 'NONE';
					}
				} else {
					return 'NONE';
				}
			} else {
				return 'NOT SET';
			}
		};

		/**
		 *
		 */
		$scope.menuUttClick = function (utt) {
			if ($scope.modifiedCurSSFF || $scope.modifiedCurTierItems) {
				$scope.lastclickedutt = utt;
				$scope.openModal('views/saveChanges.html', 'dialog', 'Changes not Saved Warning', true, 'Changes made to: ' + utt.name + '. Do you wish to save them?');
			} else {
				$scope.$broadcast('loadingNewUtt');
				// Iohandlerservice.httpGetUtterence(utt);
				Iohandlerservice.getUtt(utt);
				$scope.curUtt = utt;
			}
		};


		/**
		 *
		 */
		$scope.menuUttSave = function () {
			// Iohandlerservice.postSaveSSFF();
			Iohandlerservice.wsH.saveUtt($scope.curUtt);
			$scope.modifiedCurSSFF = false;
			$scope.modifTierItems = false;
		};

		/**
		 *
		 */
		$scope.dragStart = function () {
			viewState.setdragBarActive(true);
		};

		/**
		 *
		 */
		$scope.dragEnd = function () {
			viewState.setdragBarActive(false);
		};



		/**
		 *
		 */
		$scope.openModal = function (templatefile, cssStyle, blocking, title, content) {
			var drop = true;
			if (blocking) {
				drop = 'static';
			}
			viewState.setmodalOpen(true);
			alert('should use new dialogService');
			// $modal.open({
			// 	backdrop: drop,
			// 	keyboard: true,
			// 	backdropClick: true,
			// 	templateUrl: templatefile,
			// 	windowClass: cssStyle,
			// 	controller: 'ModalInstanceCtrl',
			// 	resolve: {
			// 		modalContent: function () {
			// 			return content;
			// 		},
			// 		modalTitle: function () {
			// 			return title;
			// 		},
			// 		windowLength: function () {
			// 			return viewState.spectroSettings.windowLength;
			// 		},
			// 		rangeFrom: function () {
			// 			return viewState.spectroSettings.rangeFrom;
			// 		},
			// 		rangeTo: function () {
			// 			return viewState.spectroSettings.rangeTo;
			// 		},
			// 		dynamicRange: function () {
			// 			return viewState.spectroSettings.dynamicRange;
			// 		},
			// 		selectSegmentsInSelection: function () {
			// 			return $scope.shortcut.selectSegmentsInSelection;
			// 		},
			// 		window: function () {
			// 			return viewState.spectroSettings.window;
			// 		},
			// 		selectFirstContourCorrectionTool: function () {
			// 			return $scope.shortcut.selectFirstContourCorrectionTool;
			// 		},
			// 		selectSecondContourCorrectionTool: function () {
			// 			return $scope.shortcut.selectSecondContourCorrectionTool;
			// 		},
			// 		selectThirdContourCorrectionTool: function () {
			// 			return $scope.shortcut.selectThirdContourCorrectionTool;
			// 		},
			// 		selectFourthContourCorrectionTool: function () {
			// 			return $scope.shortcut.selectFourthContourCorrectionTool;
			// 		},
			// 		selectNoContourCorrectionTool: function () {
			// 			return $scope.shortcut.selectNoContourCorrectionTool;
			// 		},
			// 		playAllInView: function () {
			// 			return $scope.shortcut.playAllInView;
			// 		},
			// 		keyBackspace: function () {
			// 			return $scope.shortcut.backspace;
			// 		},
			// 		snapAbove: function () {
			// 			return $scope.shortcut.snapAbove;
			// 		},
			// 		snapBelow: function () {
			// 			return $scope.shortcut.snapBelow;
			// 		},
			// 		plus: function () {
			// 			return $scope.shortcut.plus;
			// 		},
			// 		minus: function () {
			// 			return $scope.shortcut.minus;
			// 		},
			// 		snapZero: function () {
			// 			return $scope.shortcut.snapZero;
			// 		},
			// 		snapBoundary: function () {
			// 			return $scope.shortcut.snapBoundary;
			// 		},
			// 		keyAlt: function () {
			// 			return $scope.shortcut.alt;
			// 		},
			// 		playSelected: function () {
			// 			return $scope.shortcut.playSelected;
			// 		},
			// 		history: function () {
			// 			return $scope.shortcut.history;
			// 		},
			// 		keyopenSubmenu: function () {
			// 			return $scope.shortcut.openSubmenu;
			// 		},
			// 		playEntireFile: function () {
			// 			return $scope.shortcut.playEntireFile;
			// 		},
			// 		keyTab: function () {
			// 			return $scope.shortcut.tab;
			// 		},
			// 		tierUp: function () {
			// 			return $scope.shortcut.tierUp;
			// 		},
			// 		tierDown: function () {
			// 			return $scope.shortcut.tierDown;
			// 		},
			// 		keyShift: function () {
			// 			return $scope.shortcut.shift;
			// 		},
			// 		keyEnter: function () {
			// 			return $scope.shortcut.enter;
			// 		},
			// 		keyZoomIn: function () {
			// 			return $scope.shortcut.zoomIn;
			// 		},
			// 		keyZoomOut: function () {
			// 			return $scope.shortcut.zoomOut;
			// 		},
			// 		keyZoomAll: function () {
			// 			return $scope.shortcut.zoomAll;
			// 		},
			// 		keyZoomSel: function () {
			// 			return $scope.shortcut.zoomSel;
			// 		},
			// 		shiftViewPortLeft: function () {
			// 			return $scope.shortcut.shiftViewPortLeft;
			// 		},
			// 		shiftViewPortRight: function () {
			// 			return $scope.shortcut.shiftViewPortRight;
			// 		},
			// 		currentTier: function () {
			// 			if (viewState.getcurClickTierName() !== '') {
			// 				return viewState.getcurClickTierName();
			// 			} else {
			// 				return 'error';
			// 			}
			// 		}
			// 	}
			// });
		};

		/**
		 *
		 */
		$scope.changingMetaData = function () {
			$scope.modifiedMetaData = true;
		};

		/**
		 *
		 */
		$scope.changingSSFFdata = function () {
			// console.log('changingSSFFdata')
			$scope.modifiedCurSSFF = true;
		};

		/**
		 *
		 */
		$scope.modifTierItems = function () {
			console.log('items labs changed');
			$scope.modifiedCurTierItems = true;
		};

		/**
		 *
		 */
		$scope.uttIsDisabled = function (utt) {
			if (utt.name === $scope.curUtt.name) {
				return false;
			} else {
				return true;
			}
		};

		/**
		 *
		 */
		$scope.getUttColor = function (utt) {
			var curColor;
			if ($scope.modifiedCurSSFF || $scope.modifiedCurTierItems) {
				curColor = {
					'background-color': '#f00',
					'color': 'white'
				};
			} else {
				curColor = {
					'background-color': '#999',
					'color': 'black'
				};
			}

			// console.log(utt.name)
			if (utt.name === $scope.curUtt.name) {
				return curColor;
			}
		};

		/**
		 *
		 */
		$scope.getMetaBtnColor = function () {
			var curColor;
			if (!$scope.modifiedMetaData) {
				curColor = {
					'color': 'rgb(128,230,25)'
				};

			} else {
				curColor = {
					'color': 'red'
				};
			}
			return curColor;
		};

		/**
		 *
		 */
		$scope.cursorInTextField = function () {
			viewState.focusInTextField = true;
			// console.log("CURSOR");
		};

		/**
		 *
		 */
		$scope.cursorOutOfTextField = function () {
			viewState.focusInTextField = false;
		};

		/**
		 *
		 */
		$scope.openSubmenu = function () {
			if (viewState.getsubmenuOpen()) {
				viewState.setsubmenuOpen(false);
				// $('#submenuOpen').html('☰');
				$('#FileCtrl').removeClass('cbp-spmenu-open');
				$('#TimelineCtrl').removeClass('cbp-spmenu-push-toright').addClass('cbp-spmenu-push-toleft');
				$('#HandletiersCtrl').removeClass('cbp-spmenu-push-toright').addClass('cbp-spmenu-push-toleft');
				$('#menu').removeClass('cbp-spmenu-push-toright');
				$('#menu-bottom').removeClass('cbp-spmenu-push-toright');
			} else {
				viewState.setsubmenuOpen(true);
				// $('#submenuOpen').html('☰');
				$('#FileCtrl').addClass('cbp-spmenu-open');
				$('#TimelineCtrl').removeClass('cbp-spmenu-push-toleft').addClass('cbp-spmenu-push-toright');
				$('#HandletiersCtrl').removeClass('cbp-spmenu-push-toleft').addClass('cbp-spmenu-push-toright');
				$('#menu').addClass('cbp-spmenu-push-toright');
				$('#menu-bottom').addClass('cbp-spmenu-push-toright');
			}
			$timeout($scope.refreshTimeline, ConfigProviderService.vals.colors.transitionTime); // SIC !! has to be according to css transition... maybe read out value of css or set in conf
		};

		/////////////////////////////////////////
		// handle button clicks

		// top menu:

		//
		$scope.addTierSegBtnClick = function () {

			if (viewState.getPermission('addTierSegBtnClick')) {
				alert('not implemented yet');
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.addTierPointBtnClick = function () {

			if (viewState.getPermission('addTierSegBtnClick')) {
				alert('not implemented yet');
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.renameSelTierBtnClick = function () {
			if (viewState.getPermission('renameSelTierBtnClick')) {
				if (viewState.getcurClickTierName() !== undefined) {
					$scope.openModal('views/renameTier.html', 'dialog', true);
				} else {
					$scope.openModal('views/error.html', 'dialog', 'Rename Error', false, 'Please choose a Tier first !');
				}
			} else {
				console.log('action currently not allowed');
			}
		};

		$scope.downloadTextGridBtnClick = function () {
			if (viewState.getPermission('downloadTextGridBtnClick')) {
				alert('not implemented yet');
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.spectSettingsBtnClick = function () {
			if (viewState.getPermission('spectSettingsChange')) {
				dialogService.open('views/spectroSettings.html', 'SpectsettingsCtrl');
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.connectBtnClick = function () {
			if (viewState.getPermission('connectBtnClick')) {
				// $scope.openModal('views/connectModal.html', 'dialog', false);
				viewState.setState('modalShowing');
				dialogService.open('views/connectModal.html', 'WsconnectionCtrl');
			} else {
				console.log('action currently not allowed');
				// Iohandlerservice.wsH.closeConnect();
				// $scope.uttList = [];
				// $scope.showDropZone = true;
				// $scope.showSaveCommStaBtnDiv = false;
				// ConfigProviderService.httpGetConfig();
			}
		};

		//
		$scope.openDemoDBbtnClick = function () {
			if (viewState.getPermission('openDemoDBclick')) {
				ConfigProviderService.vals.main.comMode = 'http:GET';
				viewState.setState('loadingSaving');
				Iohandlerservice.getUttList('testData/demoUttList.json').then(function (res) {
					console.log(res.data);
					$('#FileCtrl').scope().hideDropZone(); // SIC should be in service
					$scope.uttList = res.data;
					Iohandlerservice.getUtt(res.data[0]);
					// should be then after get utt
					viewState.setState('labeling');
				});
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.aboutBtnClick = function () {
			dialogService.open('views/about.html', 'AboutCtrl');
		};


		// bottom menu:

		//
		$scope.cmdZoomAll = function () {
			if (viewState.getPermission('zoom')) {
				$('#HandletiersCtrl').scope().deleteEditArea(); // SIC should be in service...
				viewState.setViewPort(0, viewState.curViewPort.bufferLength);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdZoomIn = function () {
			if (viewState.getPermission('zoom')) {
				$('#HandletiersCtrl').scope().deleteEditArea(); // SIC should be in service...
				viewState.zoomViewPort(true);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdZoomOut = function () {
			if (viewState.getPermission('zoom')) {
				$('#HandletiersCtrl').scope().deleteEditArea();
				viewState.zoomViewPort(false);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdZoomLeft = function () {
			if (viewState.getPermission('zoom')) {
				$('#HandletiersCtrl').scope().deleteEditArea();
				viewState.shiftViewPort(false);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdZoomRight = function () {
			if (viewState.getPermission('zoom')) {
				$('#HandletiersCtrl').scope().deleteEditArea();
				viewState.shiftViewPort(true);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdZoomSel = function () {
			if (viewState.getPermission('zoom')) {
				$('#HandletiersCtrl').scope().deleteEditArea();
				viewState.setViewPort(viewState.curViewPort.selectS, viewState.curViewPort.selectE);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdPlayView = function () {
			if (viewState.getPermission('playaudio')) {
				Soundhandlerservice.playFromTo(viewState.curViewPort.sS, viewState.curViewPort.eS);
				viewState.animatePlayHead(viewState.curViewPort.sS, viewState.curViewPort.eS);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdPlaySel = function () {
			if (viewState.getPermission('playaudio')) {
				Soundhandlerservice.playFromTo(viewState.curViewPort.selectS, viewState.curViewPort.selectE);
				viewState.animatePlayHead(viewState.curViewPort.selectS, viewState.curViewPort.selectE);
			} else {
				console.log('action currently not allowed');
			}
		};

		//
		$scope.cmdPlayAll = function () {
			if (viewState.getPermission('playaudio')) {
				Soundhandlerservice.playFromTo(0, Soundhandlerservice.wavJSO.Data.length);
				viewState.animatePlayHead(0, Soundhandlerservice.wavJSO.Data.length);
			} else {
				console.log('action currently not allowed');
			}
		};

		// other

		//
		$scope.saveMetaData = function () {

			Iohandlerservice.wsH.saveUsrUttList($scope.curUserName, $scope.uttList);
			$scope.modifiedMetaData = false;
		};

		//
		$scope.openFile = function () {
			alert('code to open file');
		};

		//
		$scope.setlastkeycode = function (c) {
			$scope.lastkeycode = c;
		};
	});