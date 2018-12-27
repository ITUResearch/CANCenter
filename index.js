const ffi = require("ffi");

const CANBus = require("./CAN/CANBus.js");
const CanAPI = CANBus.CanLib;
const LocalServerAPI = require('./data/LocalServer');

const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('ascii');

const os = require('os');
let IPv4;
let interfaces = os.networkInterfaces();
let hostName=os.hostname();
// console.log("interface : ", interfaces);
for (let key in interfaces) {
	let alias = 0;
	interfaces[key].forEach(function(details){
		if (details.family == 'IPv4' && key == 'wlp4s0') {
				IPv4 = details.address;
		}
	});
}
console.log('----------local IP: '+IPv4);
console.log('----------local host: '+hostName);

let boardInfo = new CANBus.VCI_BOARD_INFO_EX();
let deviceN = CanAPI.VCI_ScanDevice(1);
let retDeviceInfo = CanAPI.VCI_ReadBoardInfoEx(0, boardInfo.ref());

console.log("deviceN = ", deviceN);
console.log("retDeviceInfo = ", retDeviceInfo);
console.log("--CAN_BoardInfo.ProductName = ", decoder.write(Buffer.from(boardInfo.ProductName)));
console.log("--CAN_BoardInfo.FirmwareVersion = ", boardInfo.FirmwareVersion);
console.log("--CAN_BoardInfo.HardwareVersion = ", boardInfo.HardwareVersion);
console.log("--CAN_BoardInfo.SerialNumber = ", boardInfo.SerialNumber);

// let initConfig = new CANBus.VCI_INIT_CONFIG();
// initConfig.AccCode = 0x00000000;
// initConfig.AccMask = 0xFFFFFFFF;
// initConfig.Filter = 1;
// initConfig.Mode = 0;
// initConfig.Timing0 = 0x00;
// initConfig.Timing1 = 0x1C;
//
// let retInit = CanAPI.VCI_InitCAN(CANBus.VCI_USBCAN2, 0, 0, initConfig.ref());
// console.log("Init device result = ", retInit);

let CAN_InitEx = new CANBus.VCI_INIT_CONFIG_EX();
CAN_InitEx.CAN_ABOM = 0;
CAN_InitEx.CAN_Mode = 0;

CAN_InitEx.CAN_BRP = 12; //6;
CAN_InitEx.CAN_BS1 = 4; //3;
CAN_InitEx.CAN_BS2 = 1; //2;
CAN_InitEx.CAN_SJW = 1;

CAN_InitEx.CAN_NART = 0;
CAN_InitEx.CAN_RFLM = 0;
CAN_InitEx.CAN_TXFP = 1;
CAN_InitEx.CAN_RELAY = 0;

let statusInit = CanAPI.VCI_InitCANEx(CANBus.VCI_USBCAN2, 0, 0, CAN_InitEx.ref());
console.log("Init Can Index 1 result = ", statusInit);
CAN_InitEx.CAN_BRP = 9; //6;
CAN_InitEx.CAN_BS1 = 2; //3;
CAN_InitEx.CAN_BS2 = 1; //2;
CAN_InitEx.CAN_SJW = 1;
console.log("CAN_InitEx - ", CAN_InitEx);
statusInit = CanAPI.VCI_InitCANEx(CANBus.VCI_USBCAN2, 0, 1, CAN_InitEx.ref());
console.log("Init Can Index 2 result = ", statusInit);


let getDataCallback = ffi.Callback('void', ['uint32', 'uint32', 'uint32'],
    function(devIndex, canIndex, len) {
      console.log("getDataCallback :");
      console.log("devIndex: ", devIndex);
      console.log("canIndex: ", canIndex);
      console.log("len: ", len);
      let dataNum = CanAPI.VCI_GetReceiveNum(CANBus.VCI_USBCAN2, devIndex, canIndex);
      console.log("dataNum: ", dataNum);

			let now = new Date().getTime();

      if (dataNum > 0) {
        canReceiveData = new CANBus.CanObjArray(2);
        CanAPI.VCI_Receive(CANBus.VCI_USBCAN2, devIndex, canIndex, canReceiveData, dataNum, 0);
        // console.log("receiveData = ", canReceiveData);
        for (let i = 0; i < dataNum; i++) {
          console.log("callback got");
          console.log("--CAN_ReceiveData.RemoteFlag = ", canReceiveData[i].RemoteFlag);
          console.log("--CAN_ReceiveData.ExternFlag = ", canReceiveData[i].ExternFlag);
          console.log("--CAN_ReceiveData.ID = ", canReceiveData[i].ID);
          console.log("--CAN_ReceiveData.DataLen = ", canReceiveData[i].DataLen);
          console.log("--CAN_ReceiveData.Data:");
					let dataStr = "";
          for (let j = 0; j < canReceiveData[i].DataLen; j++) {
            dataStr = dataStr + canReceiveData[i].Data[j] + "|";
          }
					console.log(dataStr);
					let receivedInfo = {
						data: dataStr
					}

          console.log("callback TimeStamp")
          console.log("--CAN_ReceiveData.TimeStamp = ", canReceiveData[i].TimeStamp)

					let endInfo = {
						"ip": IPv4,
						"end_device_id": canReceiveData[i].ID.toString()
					}
					let postData = {
						device_name: "C21_sample",
						device_id: canReceiveData[i].ID.toString(),
						time_stamp: now,
						info:receivedInfo,
						end_device: endInfo
					};
					LocalServerAPI.postDeviceInfo(postData);
        }
      }
    });
let resReg = CanAPI.VCI_RegisterReceiveCallback(0, getDataCallback);
console.log("result of VCI_RegisterReceiveCallback = ", resReg);

let retStart = CanAPI.VCI_StartCAN(CANBus.VCI_USBCAN2, 0, 0);
console.log("result of VCI_StartCAN : ", retStart);

let canSendData = new CANBus.CanObjArray(2);

for (let i = 0; i < 2; i++) {
  canSendData[i].DataLen = 8;
  for (let j = 0; j < canSendData[i].DataLen; j++) {
    canSendData[i].Data[j] = i + j + 3;
  }
  canSendData[i].ExternFlag = 0;
  canSendData[i].RemoteFlag = 0;
  canSendData[i].ID = 0x468;
  canSendData[i].SendType = 0;
}
console.log("canSendData[1] = ", canSendData[1]);
// console.log("typeof canSendData = ", typeof canSendData);
resSent = CanAPI.VCI_Transmit(CANBus.VCI_USBCAN2, 0, 0, canSendData.ref(), 2);
console.log("result of send : ", resSent);

setTimeout(() => {
  console.log("Enter the enter to continue");
  let stdin = process.openStdin();

  stdin.addListener("data", function(d) {
      // note:  d is an object, and when converted to a string it will
      // end with a linefeed.  so we (rather crudely) account for that
      // with toString() and then trim()
      console.log("you entered: [" +
          d.toString().trim() + "]");
    });
}, 3000);
