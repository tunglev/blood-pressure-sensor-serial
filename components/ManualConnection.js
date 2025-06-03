import React, { Component } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, DeviceEventEmitter } from 'react-native';
import { RNSerialport, definitions, actions } from 'react-native-serialport';

// Create a safe wrapper for RNSerialport methods
const SerialPortWrapper = {
	isInitialized: function() {
		return typeof RNSerialport !== 'undefined' && RNSerialport !== null;
	},
	
	setReturnedDataType: function(type) {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.setReturnedDataType(type);
			return true;
		} catch (e) {
			console.error('Error in setReturnedDataType:', e);
			return false;
		}
	},
	
	setAutoConnectBaudRate: function(rate) {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.setAutoConnectBaudRate(rate);
			return true;
		} catch (e) {
			console.error('Error in setAutoConnectBaudRate:', e);
			return false;
		}
	},
	
	setInterface: function(interfaceId) {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.setInterface(interfaceId);
			return true;
		} catch (e) {
			console.error('Error in setInterface:', e);
			return false;
		}
	},
	
	setAutoConnect: function(autoConnect) {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.setAutoConnect(autoConnect);
			return true;
		} catch (e) {
			console.error('Error in setAutoConnect:', e);
			return false;
		}
	},
	
	startUsbService: function() {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.startUsbService();
			return true;
		} catch (e) {
			console.error('Error in startUsbService:', e);
			return false;
		}
	},
	
	stopUsbService: function() {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.stopUsbService();
			return true;
		} catch (e) {
			console.error('Error in stopUsbService:', e);
			return false;
		}
	},
	
	isOpen: async function() {
		if (!this.isInitialized()) return false;
		try {
			return await RNSerialport.isOpen();
		} catch (e) {
			console.error('Error in isOpen:', e);
			return false;
		}
	},
	
	disconnect: function() {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.disconnect();
			return true;
		} catch (e) {
			console.error('Error in disconnect:', e);
			return false;
		}
	},
	
	intArrayToUtf16: function(array) {
		if (!this.isInitialized()) return '';
		try {
			return RNSerialport.intArrayToUtf16(array);
		} catch (e) {
			console.error('Error in intArrayToUtf16:', e);
			return '';
		}
	},
	
	hexToUtf16: function(hex) {
		if (!this.isInitialized()) return '';
		try {
			return RNSerialport.hexToUtf16(hex);
		} catch (e) {
			console.error('Error in hexToUtf16:', e);
			return '';
		}
	},
	
	writeString: function(text) {
		if (!this.isInitialized()) return false;
		try {
			RNSerialport.writeString(text);
			return true;
		} catch (e) {
			console.error('Error in writeString:', e);
			return false;
		}
	}
};

//type Props = {};
class ManualConnection extends Component {
	constructor(props) {
		super(props);

		this.state = {
			servisStarted: false,
			connected: false,
			usbAttached: false,
			output: '',
			outputArray: [],
			baudRate: '115200',
			interface: '-1',
			sendText: 'HELLO',
			returnedDataType: definitions.RETURNED_DATA_TYPES.HEXSTRING,
		};

		this.startUsbListener = this.startUsbListener.bind(this);
		this.stopUsbListener = this.stopUsbListener.bind(this);
	}

	componentDidMount() {
		this.startUsbListener();
	}

	componentWillUnmount() {
		this.stopUsbListener();
	}

	startUsbListener() {
		// Check if RNSerialport is properly initialized
		if (!SerialPortWrapper.isInitialized()) {
			console.error('RNSerialport is not available or initialized');
			Alert.alert(
				'Error',
				'Serial port module is not available on this device',
				[{ text: 'OK' }]
			);
			return;
		}

		DeviceEventEmitter.addListener(actions.ON_SERVICE_STARTED, this.onServiceStarted, this);
		DeviceEventEmitter.addListener(actions.ON_SERVICE_STOPPED, this.onServiceStopped, this);
		DeviceEventEmitter.addListener(actions.ON_DEVICE_ATTACHED, this.onDeviceAttached, this);
		DeviceEventEmitter.addListener(actions.ON_DEVICE_DETACHED, this.onDeviceDetached, this);
		DeviceEventEmitter.addListener(actions.ON_ERROR, this.onError, this);
		DeviceEventEmitter.addListener(actions.ON_CONNECTED, this.onConnected, this);
		DeviceEventEmitter.addListener(actions.ON_DISCONNECTED, this.onDisconnected, this);
		DeviceEventEmitter.addListener(actions.ON_READ_DATA, this.onReadData, this);
		
		SerialPortWrapper.setReturnedDataType(this.state.returnedDataType);
		SerialPortWrapper.setAutoConnectBaudRate(parseInt(this.state.baudRate, 10));
		SerialPortWrapper.setInterface(parseInt(this.state.interface, 10));
		SerialPortWrapper.setAutoConnect(true);
		SerialPortWrapper.startUsbService();
	}

	stopUsbListener = async () => {
		DeviceEventEmitter.removeAllListeners();
		
		if (!SerialPortWrapper.isInitialized()) {
			console.error('RNSerialport is not initialized');
			return;
		}
		
		const isOpen = await SerialPortWrapper.isOpen();
		if (isOpen) {
			Alert.alert('isOpen', isOpen);
			SerialPortWrapper.disconnect();
		}
		SerialPortWrapper.stopUsbService();
	};

	onServiceStarted(response) {
		this.setState({ servisStarted: true });
		if (response.deviceAttached) {
			this.onDeviceAttached();
		}
	}
	onServiceStopped() {
		this.setState({ servisStarted: false });
	}
	onDeviceAttached() {
		this.setState({ usbAttached: true });
	}
	onDeviceDetached() {
		this.setState({ usbAttached: false });
	}
	onConnected() {
		this.setState({ connected: true });
	}
	onDisconnected() {
		this.setState({ connected: false });
	}
	onReadData(data) {
		if (!SerialPortWrapper.isInitialized()) {
			console.error('RNSerialport is not initialized');
			return;
		}
		
		if (this.state.returnedDataType === definitions.RETURNED_DATA_TYPES.INTARRAY) {
			const payload = SerialPortWrapper.intArrayToUtf16(data.payload);
			this.setState({ output: this.state.output + payload });
		} else if (this.state.returnedDataType === definitions.RETURNED_DATA_TYPES.HEXSTRING) {
			const payload = SerialPortWrapper.hexToUtf16(data.payload);
			this.setState({ output: this.state.output + payload });
		}
	}

	onError(error) {
		console.error(error);
	}

	handleConvertButton() {
		if (!SerialPortWrapper.isInitialized()) {
			console.error('RNSerialport is not initialized');
			return;
		}
		
		let data = '';
		if (this.state.returnedDataType === definitions.RETURNED_DATA_TYPES.HEXSTRING) {
			data = SerialPortWrapper.hexToUtf16(this.state.output);
		} else if (this.state.returnedDataType === definitions.RETURNED_DATA_TYPES.INTARRAY) {
			data = SerialPortWrapper.intArrayToUtf16(this.state.outputArray);
		} else {
			return;
		}
		this.setState({ output: data });
	}

	handleClearButton() {
		this.setState({ output: '' });
		this.setState({ outputArray: [] });
	}

	handleSendButton() {
		if (!SerialPortWrapper.isInitialized()) {
			console.error('RNSerialport is not initialized');
			return;
		}
		
		if (!this.state.connected) {
			Alert.alert('Error', 'Device is not connected');
			return;
		}
		
		SerialPortWrapper.writeString(this.state.sendText);
	}

	buttonStyle = (status) => {
		return status ? styles.button : Object.assign({}, styles.button, { backgroundColor: '#C0C0C0' });
	};

	render() {
		return (
			<ScrollView style={styles.body}>
				<View style={styles.container}>
					<View style={styles.header}>
						<View style={styles.line}>
							<Text style={styles.title}>Service:</Text>
							<Text style={styles.value}>{this.state.servisStarted ? 'Started' : 'Not Started'}</Text>
						</View>
						<View style={styles.line}>
							<Text style={styles.title}>Usb:</Text>
							<Text style={styles.value}>{this.state.usbAttached ? 'Attached' : 'Not Attached'}</Text>
						</View>
						<View style={styles.line}>
							<Text style={styles.title}>Connection:</Text>
							<Text style={styles.value}>{this.state.connected ? 'Connected' : 'Not Connected'}</Text>
						</View>
					</View>
					<ScrollView style={styles.output} nestedScrollEnabled={true}>
						<Text style={styles.full}>{this.state.output === '' ? 'No Content' : this.state.output}</Text>
					</ScrollView>

					<View style={styles.inputContainer}>
						<Text>Send</Text>
						<TextInput
							style={styles.textInput}
							onChangeText={(text) => this.setState({ sendText: text })}
							value={this.state.sendText}
							placeholder={'Send Text'}
						/>
					</View>
					<View style={styles.line2}>
						<TouchableOpacity
							style={this.buttonStyle(this.state.connected)}
							onPress={() => this.handleSendButton()}
							disabled={!this.state.connected}
						>
							<Text style={styles.buttonText}>Send</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.button} onPress={() => this.handleClearButton()}>
							<Text style={styles.buttonText}>Clear</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.button} onPress={() => this.handleConvertButton()}>
							<Text style={styles.buttonText}>Convert</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		);
	}
}

const styles = StyleSheet.create({
	full: {
		flex: 1,
	},
	body: {
		flex: 1,
	},
	container: {
		flex: 1,
		marginTop: 20,
		marginLeft: 16,
		marginRight: 16,
	},
	header: {
		display: 'flex',
		justifyContent: 'center',
		//alignItems: "center"
	},
	line: {
		display: 'flex',
		flexDirection: 'row',
	},
	line2: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	title: {
		width: 100,
	},
	value: {
		marginLeft: 20,
	},
	output: {
		marginTop: 10,
		height: 300,
		padding: 10,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
	},
	inputContainer: {
		marginTop: 10,
		borderBottomWidth: 2,
	},
	textInput: {
		paddingLeft: 10,
		paddingRight: 10,
		height: 40,
	},
	button: {
		marginTop: 16,
		marginBottom: 16,
		paddingLeft: 15,
		paddingRight: 15,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#147efb',
		borderRadius: 3,
	},
	buttonText: {
		color: '#FFFFFF',
	},
});

export default ManualConnection;
