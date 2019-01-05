# CANCenter

## 0. how to start
```
npm insatll -g concurrently
sudo npm start
```
The service contains 2 services:  
#### 1) CANCenterClient  
CANCenterClient will collect the data from end device via CAN and report it to Local Server.  

start CANCenterClient independently
```
sudo npm run client
```
#### 2) BroadcastReceiver  
BroadcastReceiver will transmit the action from Local Server to target end device via CAN according to FrameID.  
The data frame is defined in **1. CAN data frame**  

start BroadcastReceiver independently
```
sudo npm run udpServer
```

## 1. CAN data frame
![Standard CAN data frame](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/CAN-Bus-frame_in_base_format_without_stuffbits.svg/709px-CAN-Bus-frame_in_base_format_without_stuffbits.svg.png)
The data struct is as follow:

```
{
	ID: 'uint32',			    //text ID.
	TimeStamp: 'uint32',	//timestamp of the frame arriving, started from initialization of CAN controller
	TimeFlag: 'uint8',  	// if using timestamp, 1: use TimeStamp, 0��not use. TimeFlag and TimeStamp is available when the frame is received frame
	SendType: 'uint8',  	//send frame type. 0: normal send, 1: single send, 2: self send/receive, 3: single self send/receive, only available when
						//the frame is send frame.(when device type is EG20T-CAN, send type will be set at VCI_InitCan and it's invalid set herein
						//When set to self send/receive mode, EG20T-CAN can not receive from bus, only can receive from itself)
	RemoteFlag: 'uint8',	//remote frame flag
	ExternFlag: 'uint8',	//extended frame flag
	DataLen: 'uint8',    	//Data length(<=8), how many uint8_ts of data
	Data: refArray('uint8', 8),		  //text data
	Reserved: refArray('uint8', 3)	//reserved
}
```
Now we focus on the Data field (red), it has 0–64 (0-8 bytes)	Data to be transmitted (length dictated by DLC field).  
Our protocol is as follow:  


|  0  |  1  |   2  |   3  |   4  |   5  |   6  |  7   |
|:---: |:---:| :---:| :---:| :---:| :---:| :---:| :---:|
| sensorType | data index | total number | data length (1-4)Bytes | sensor data | sensor data | sensor data | sensor data |
```
Transmit :
Data[0] : sensorType enum
Data[1] : index of sensor
Data[2] : total number of sensors in C21
Data[3] : data length(1-4)
Data[4] - [7] : data
```

|  0  |  1  |   2  |   3  |   4  |   5  |   6  |  7   |
|:---: |:---:| :---:| :---:| :---:| :---:| :---:| :---:|
| commandID | paramter description | params | params | params | params | params | params |
```
Receive:
Data[0] : commondID enum
Data[1] : 4-bit param number + 4-bit param data length
Data[2] - Data[7] : paramter
```
