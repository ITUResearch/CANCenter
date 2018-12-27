const ffi = require("ffi");
const ref = require("ref");
const refStruct = require("ref-struct");
const refArray = require("ref-array");

// CAN type definition
const VCI_USBCAN1 = 3;
const VCI_USBCAN2 = 4;

//5.definition of CAN initialization data type
let VCI_INIT_CONFIG = refStruct({
	"AccCode": ref.types.uint32,	//ACC code (for verification)
	"AccMask": ref.types.uint32,	//Mask code
	"Reserved": ref.types.uint32,	//reserved
	"Filter": ref.types.uint8,		//filter type.0: double filter, 1: single filter
	"Timing0": ref.types.uint8,	  //Timer 0(BTR0).
	"Timing1": ref.types.uint8,	  //Timer 1(BTR1).
	"Mode": ref.types.uint8		    //Mode
});

let VCI_INIT_CONFIG_EX = refStruct({
  "CAN_BRP": ref.types.uint32,    // range: 1~1024, CAN baudrate = 36MHz/(CAN_BRP)/(CAN_SJW+CAN_BS1+CAN_BS2)
  "CAN_SJW": ref.types.uint8,     // range: 1~4
  "CAN_BS1": ref.types.uint8,     // range: 1~16
  "CAN_BS2": ref.types.uint8,     // range: 1~8
  "CAN_Mode": ref.types.uint8,    // CAN working mode. 0: normal,1: loopback,2: silent,3: silent loopback
  "CAN_ABOM": ref.types.uint8,    // auto off line management. 0: prohibit,1: enable
  "CAN_NART": ref.types.uint8,    // text repeat send management. 0: enable text repeat sending,1: disable text repeat sending
  "CAN_RFLM": ref.types.uint8,    // FIFO lock management. 0: new text overwrite old, 1: ignore new text
  "CAN_TXFP": ref.types.uint8,    // send priority management, 0: by ID, 1: by order
  "CAN_RELAY": ref.types.uint8,   // relay feature enable. 0x00: close relay function,0x10: relay from CAN1 to CAN2,0x01: relay from CAN2 to CAN1, 0x11: bidirectionaly relay
  "Reserved": ref.types.uint32    // reserved
});

let VCI_FILTER_CONFIG = refStruct({
	"Enable": ref.types.uint8,			//filter enable, 1: enable, 0: disable
	"FilterIndex": ref.types.uint8,	//filter index, range: 0~13
	"FilterMode": ref.types.uint8,		//filter mode, 0: mask bit, 1: id list
	"ExtFrame": ref.types.uint8,		//filter frame flag, 1: the frame to be filtered is extended frame, 0��the frame to be filtered is standard frame
	"ID_Std_Ext": ref.types.uint32,		//verification code ID
	"ID_IDE": ref.types.uint32,			//verification code IDE
	"ID_RTR": ref.types.uint32,			//verification code RTR
	"MASK_Std_Ext": ref.types.uint32,	//Mask code ID, only available when filter mode set to mask bit mode
	"MASK_IDE": ref.types.uint32,		//Mask code IDE, only available when filter mode set to mask bit mode
	"MASK_RTR": ref.types.uint32,		//Mask code RTR, only available when filter mode set to mask bit mode
	"Reserved": ref.types.uint32		//reserved
});

let VCI_BOARD_INFO_EX = refStruct({
  "ProductName": refArray('uint8', 32),	    //hardware name,for example: ��Ginkgo-CAN-Adapter\0��(note: include string null end'\0��)
	"FirmwareVersion": refArray('uint8', 4),	//firmware version
	"HardwareVersion": refArray('uint8', 4),	//hardware version
	"SerialNumber": refArray('uint8', 12)   	//adapter serial number
});

let VCI_CAN_OBJ = refStruct({
  ID: 'uint32',			    //text ID.
	TimeStamp: 'uint32',	//timestamp of the frame arriving, started from initialization of CAN controller
	TimeFlag: 'uint8',  	// if using timestamp, 1: use TimeStamp, 0： not use. TimeFlag and TimeStamp is available when the frame is received frame
	SendType: 'uint8',  	//send frame type. 0: normal send, 1: single send, 2: self send/receive, 3: single self send/receive, only available when
						//the frame is send frame.(when device type is EG20T-CAN, send type will be set at VCI_InitCan and it's invalid set herein
						//When set to self send/receive mode, EG20T-CAN can not receive from bus, only can receive from itself)
	RemoteFlag: 'uint8',	//remote frame flag
	ExternFlag: 'uint8',	//extended frame flag
	DataLen: 'uint8',    	//Data length(<=8), how many uint8_ts of data
	Data: refArray('uint8', 8),		  //text data
	Reserved: refArray('uint8', 3)	//reserved
});

let CanObjArray = refArray(VCI_CAN_OBJ);

let VciConfigPtr = ref.refType(VCI_INIT_CONFIG);
let VciConfigExPtr = ref.refType(VCI_INIT_CONFIG_EX);
let VciBoardInfoPtr = ref.refType(VCI_BOARD_INFO_EX);
let VciFilterConfigPtr = ref.refType(VCI_FILTER_CONFIG);

const CanLib = ffi.Library("./lib/linux/64bit/libGinkgo_Driver.so", {
  'VCI_ScanDevice': ['uint32', ['uint8']],
  'VCI_OpenDevice': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_CloseDevice': ['uint32', ['uint32', 'uint32']],
  'VCI_InitCAN': ['uint32', ['uint32', 'uint32', 'uint32', VciConfigPtr]],
  'VCI_InitCANEx': ['uint32', ['uint32', 'uint32', 'uint32', VciConfigExPtr]],
	'VCI_SetFilter': ['uint32', ['uint32', 'uint32', 'uint32', VciFilterConfigPtr]],
  'VCI_ReadBoardInfoEx': ['uint32', ['uint32', VciBoardInfoPtr]],
  'VCI_GetReceiveNum': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_ClearBuffer': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_StartCAN': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_ResetCAN': ['uint32', ['uint32', 'uint32', 'uint32']],
  'VCI_RegisterReceiveCallback': ['uint32', ['uint32', 'pointer']],
  'VCI_LogoutReceiveCallback': ['uint32', ['uint32']],
  'VCI_Transmit': ['uint32', ['uint32', 'uint32', 'uint32', CanObjArray, 'uint32']],
  'VCI_Receive': ['uint32', ['uint32', 'uint32', 'uint32', CanObjArray, 'uint32' ,'uint32']]
});

module.exports = {
	VCI_USBCAN1: VCI_USBCAN1,
  VCI_USBCAN2: VCI_USBCAN2,
  VCI_BOARD_INFO_EX: VCI_BOARD_INFO_EX,
  VCI_INIT_CONFIG: VCI_INIT_CONFIG,
	VCI_INIT_CONFIG_EX: VCI_INIT_CONFIG_EX,
	VCI_FILTER_CONFIG: VCI_FILTER_CONFIG,
  VCI_CAN_OBJ: VCI_CAN_OBJ,
	CanObjArray: CanObjArray,
  CanLib: CanLib
}
