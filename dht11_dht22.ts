/**
 * MakeCode editor extension for DHT11 and DHT22 humidity/temperature sensors (BETA)
 * by Alan Wang
 */
//% block="DHT11/DHT22" weight=100 color=#ff8f3f icon="\uf043"
namespace DHT11_DHT22 {

    let _temperature: number = 0.0
    let _humidity: number = 0.0
    let _checksum: number = 0

    /**
    * Query data from DHT11/DHT22 sensor. If you are using one wih 4 pins and no PCB board, you'll need to pull up the data pin. 
    * It is also recommended to wait 2 seconds between each query.
    */
    //% block="Query $DHT|Data pin $dataPin|Pin pull up $pullUp|Serial output $serialOtput|Wait 2 sec after query $wait"
    //% pullUp.defl=true
    //% serialOtput.defl=false
    //% wait.defl=true
    //% blockExternalInputs=true
    export function queryData(DHT: DHTtype, dataPin: DigitalPin, pullUp: boolean, serialOtput: boolean, wait: boolean) {

        //initialize
        let startTime: number = 0
        let endTime: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)
        _humidity = 0.0
        _temperature = 0.0
        _checksum = 0

        startTime = input.runningTimeMicros()

        //request data
        pins.digitalWritePin(dataPin, 0) //begin protocol
        basic.pause(18)
        if (pullUp) pins.setPull(dataPin, PinPullMode.PullUp) //pull up data pin if needed
        pins.digitalReadPin(dataPin)
        while (pins.digitalReadPin(dataPin) == 1);
        while (pins.digitalReadPin(dataPin) == 0); //sensor response
        while (pins.digitalReadPin(dataPin) == 1); //sensor response

        //read data (5 bytes)
        for (let index = 0; index < 40; index++) {
            while (pins.digitalReadPin(dataPin) == 1);
            while (pins.digitalReadPin(dataPin) == 0);
            control.waitMicros(28)
            //if sensor pull up data pin for more than 28 us it means 1, otherwise 0
            if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
        }

        endTime = input.runningTimeMicros()

        //byte number array convert to integer
        for (let index = 0; index < 5; index++) {
            for (let index2 = 0; index2 < 8; index2++) {
                if (dataArray[8 * index + index2]) {
                    resultArray[index] += 2 ** (7 - index2)
                }
            }
        }

        //read data
        if (DHT == DHTtype.DHT11) {
            //DHT11
            if (resultArray[4] == resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]) {
                _humidity = resultArray[0] + resultArray[1] / 100
                _temperature = resultArray[2] + resultArray[3] / 100
                _checksum = resultArray[4]
            }
        } else if (DHT == DHTtype.DHT22) {
            //DHT22
            let DHT22_dataArray: number[] = [0, 0]
            for (let index = 0; index < 2; index++) {
                for (let index2 = 0; index2 < 16; index2++) {
                    if (dataArray[16 * index + index2]) DHT22_dataArray[index] += 2 ** (15 - index2)
                }
            }
            _humidity = DHT22_dataArray[0] / 10
            _temperature = DHT22_dataArray[1] / 10
            _checksum = resultArray[4]
        }

        //serial output
        if (serialOtput) {
            let DHTstr: string = ""
            if (DHT == DHTtype.DHT11) {
                DHTstr = "DHT11"
            } else if (DHT == DHTtype.DHT22) {
                DHTstr = "DHT22"
            }
            serial.writeLine(DHTstr + " query completed in " + (endTime - startTime) + " microseconds")
            serial.writeLine("Humidity: " + _humidity + " %")
            serial.writeLine("Temperature: " + _temperature + " 'C")
            serial.writeLine("------------------------------")
        }

        //wait 2 sec after query if needed
        if (wait) basic.pause(2000)

    }

    /**
    * Read humidity/temperature data from lastest query of DHT11/DHT22
    */
    //% block="Read $data"
    export function readData(data: dataType): number {
        let returnData: number = 0
        switch (data) {
            case dataType.humidity:
                returnData = _humidity
                break
            case dataType.temperature:
                returnData = _temperature
        }
        return returnData
    }

}

enum DHTtype {
    //% block="DHT11"
    DHT11 = 5,
    //% block="DHT22"
    DHT22 = 3,
}

enum dataType {
    //% block="humidity"
    humidity,
    //% block="temperature"
    temperature,
}