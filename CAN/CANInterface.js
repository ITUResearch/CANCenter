const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('ascii');

const CANBus = require("./CANBus.js");
const CanAPI = CANBus.CanLib;

class CANInterface {
  constructor() {
    let boardInfo = new CANBus.VCI_BOARD_INFO_EX();
    let deviceN = CanAPI.VCI_ScanDevice(1);
    let retDeviceInfo = CanAPI.VCI_ReadBoardInfoEx(0, boardInfo.ref());

    console.log("deviceN = ", deviceN);
    console.log("retDeviceInfo = ", retDeviceInfo);
    console.log("--CAN_BoardInfo.ProductName = ", decoder.write(Buffer.from(boardInfo.ProductName)));
    console.log("--CAN_BoardInfo.FirmwareVersion = ", boardInfo.FirmwareVersion);
    console.log("--CAN_BoardInfo.HardwareVersion = ", boardInfo.HardwareVersion);
    console.log("--CAN_BoardInfo.SerialNumber = ", boardInfo.SerialNumber);

    //Open device
    // let status = CanAPI.VCI_OpenDevice(CANBus.VCI_USBCAN2, 0, 0);
    // console.log("result of VCI_OpenDevice : ", status);

    // standard initialization config
    // let initConfig = new CANBus.VCI_INIT_CONFIG();
    // initConfig.AccCode = 0x00000000;
    // initConfig.AccMask = 0xFFFFFFFF;
    // initConfig.Filter = 1;
    // initConfig.Mode = 0;
    // initConfig.Timing0 = 0x00;
    // initConfig.Timing1 = 0x1C;
    //
    // let retInit = CanAPI.VCI_InitCAN(CANBus.VCI_USBCAN2, 0, 0, initConfig.ref());


    let CAN_InitEx = new CANBus.VCI_INIT_CONFIG_EX();
    CAN_InitEx.CAN_ABOM = 0;
    CAN_InitEx.CAN_Mode = 0;

    CAN_InitEx.CAN_BRP = 12; //6;
		CAN_InitEx.CAN_BS1 = 4; //3;
		CAN_InitEx.CAN_BS2 = 1; //2;
		CAN_InitEx.CAN_SJW = 1;

    CAN_InitEx.CAN_NART = 1;
    CAN_InitEx.CAN_RFLM = 0;
    CAN_InitEx.CAN_TXFP = 1;
		CAN_InitEx.CAN_RELAY = 0;

    let statusInit = CanAPI.VCI_InitCANEx(CANBus.VCI_USBCAN2, 0, 0, CAN_InitEx.ref());
    console.log("Init Can Index 1 result = ", statusInit);
    CAN_InitEx.CAN_BRP = 12; //6;
    CAN_InitEx.CAN_BS1 = 4; //3;
    CAN_InitEx.CAN_BS2 = 1; //2;
    CAN_InitEx.CAN_SJW = 1;
    console.log("CAN_InitEx - ", CAN_InitEx);
    statusInit = CanAPI.VCI_InitCANEx(CANBus.VCI_USBCAN2, 0, 1, CAN_InitEx.ref());
    console.log("Init Can Index 2 result = ", statusInit);
    //Set filter1128,
    let CAN_FilterConfig = new CANBus.VCI_FILTER_CONFIG();
    CAN_FilterConfig.FilterIndex = 0;
    CAN_FilterConfig.Enable = 1;		//Enable0x09
    CAN_FilterConfig.ExtFrame = 0;
    CAN_FilterConfig.FilterMode = 0;
    CAN_FilterConfig.ID_IDE = 0;
    CAN_FilterConfig.ID_RTR = 0;
    CAN_FilterConfig.ID_Std_Ext = 0;
    CAN_FilterConfig.MASK_IDE = 0;
    CAN_FilterConfig.MASK_RTR = 0;
    CAN_FilterConfig.MASK_Std_Ext = 0;
    console.log("CAN_FilterConfig : ", CAN_FilterConfig);
    let status = CanAPI.VCI_SetFilter(CANBus.VCI_USBCAN2, 0, 0, CAN_FilterConfig.ref());
    console.log("result of VCI_SetFilter : ", status);

    status = CanAPI.VCI_StartCAN(CANBus.VCI_USBCAN2, 0, 0);
    console.log("result of VCI_StartCAN : ", status);

    // let retStart = CanAPI.VCI_StartCAN(CANBus.VCI_USBCAN2, 0, 0);
    // console.log("result of VCI_StartCAN : ", retStart);
  }
  static getInstance() {
    return CANInterface.instance || (CANInterface.instance = new CANInterface());
  }
  setInterval(id, seconds) {
    let idNum = parseInt(id);
    console.log("setInterval - id = " + id + ", seconds = " + seconds);
    console.log("setInterval - typeof(idNum) = " + typeof idNum + ", seconds = " + seconds);

    // send 1 frame data everytime, CANBus.CanObjArray(2); will not work;
    let canSendData = new CANBus.CanObjArray(1);

    // for (var i = 0; i < 2; i++) {
    //   canSendData[i].DataLen = 8;1128,
    //   for (let j = 0; j < canSendData[i].DataLen; j++) {
    //     canSendData[i].Data[j] = 0;
    //   }
    //   // canSendData[i].Data[7] = parseInt(seconds);
    //   canSendData[i].Data[7] = 0x0A;
    //   console.log("Data[7] = ", canSendData[i].Data[7]);
    //   canSendData[i].ExternFlag = 0;
    //   canSendData[i].RemoteFlag = 0;
    //   canSendData[i].ID = 0x468;
    //   canSendData[i].SendType = 0;
    // }
    canSendData[0].DataLen = 8;
    for (let j = 0; j < canSendData[0].DataLen; j++) {
      canSendData[0].Data[j] = j;
    }
    // canSendData[i].Data[7] = parseInt(seconds);
    canSendData[0].Data[7] = 0x0A;
    console.log("Data[7] = ", canSendData[0].Data[7]);
    canSendData[0].ExternFlag = 0;
    canSendData[0].RemoteFlag = 0;
    canSendData[0].ID = 0x285;
    canSendData[0].SendType = 0;
    console.log("Data to send : ", canSendData);

    let resSent = CanAPI.VCI_Transmit(CANBus.VCI_USBCAN2, 0, 0, canSendData.ref(), 1);
    console.log("result of send : ", resSent);
  }
}


module.exports = CANInterface.getInstance()
