import React, {useEffect, useState} from 'react';
import axios from 'axios'
import styles from "./styles.module.css"
// @ts-ignore
import useInterval from '@use-hooks/interval';
//TYPES////////////////////////////////////////////////////////////////////////////////////////////////////////////////
interface GameSettingsType {
    easyMode:GameSettingType
    normalMode:GameSettingType
    hardMode:GameSettingType
}
interface GameSettingType{
    field:number
    delay:number
}
interface WinnerType{
    id:number
    winner:string
    date:string
}
type BoxesForTapType = [{x:number , y:number , tappedBy:null|string}]
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let App:React.FC = () => {
    //DECLARATION BLOCK
    let [FieldSize, setFieldSize] = useState(5)
    let [Delay,SetDelay] = useState(2000)
    let [Timer,SetTimer] = useState()
    let [GameSettings,SetGameSettings] = useState<GameSettingsType>()
    let [PlayAgain , SetPlayAgain] = useState(false)
    let [Winners,SetWinners] = useState<Array<WinnerType>>([])
    let [Name,SetName] = useState()
    let [GameStart ,SetGameStart] = useState(false)
    let [Winner,SetWinner] = useState()
    let UserScore =0
    let AIScore = 0;
    let    ScreenSize:number = 500
    let BoxSize:number = ScreenSize / FieldSize
    //FETCHING HOOKS///////////////////////////////////////////////////////////////////////////////////////////////////
            useEffect( () => {

            axios.get("https://starnavi-frontend-test-task.herokuapp.com/game-settings").then(response=>{
                SetGameSettings(response.data)
            })
        }, [])
        useEffect(()=>{

            axios.get("https://starnavi-frontend-test-task.herokuapp.com/winners").then(response=>{
                SetWinners(response.data)
                })
        },[])
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //TIMER START HOOK////////////////////////////////////////////////////////////////////////////////////////////////
    useEffect(()=>{SetTimer(Delay)},[Delay])
    useInterval(()=>{
        if(Timer>100 &&GameStart){
            SetTimer(Timer-100)
        }else{
            SetTimer(Delay)
        }
    },100)
    //RENDER FUNCTION/////////////////////////////////////////////////////////////////////////////////////////////////
    let buildTable = (ScreenSize:number,BoxSize:number,BoxesForTap:BoxesForTapType):void => {
        let canvas:any =  document.getElementById("GameWindow");
        let context:any = canvas!.getContext("2d");

        for (let x = 0.5; x < ScreenSize; x += BoxSize) {
            context.moveTo(x, 0);
            context.lineTo(x, ScreenSize);
        }

        for (let y = 0.5; y < ScreenSize; y += BoxSize) {
            context.moveTo(0, y);
            context.lineTo(ScreenSize, y);
        }
        context.strokeStyle = "#888";
        context.stroke();
        BoxesForTap.map(b=>{
            switch(b.tappedBy) {
                case null : context.fillStyle = "#FFFFFF"
                    context.fillRect(b.x*BoxSize+3, b.y*BoxSize+3, BoxSize-5, BoxSize-5);
                    break
                case "User" : context.fillStyle = "#3BB143"
                    context.fillRect(b.x*BoxSize+3, b.y*BoxSize+3, BoxSize-5, BoxSize-5);
                    break
                case "AI" : context.fillStyle = "#FF0000"
                    context.fillRect(b.x*BoxSize+3, b.y*BoxSize+3, BoxSize-5, BoxSize-5);
                    break
                case "Wait": context.fillStyle = "#00BFFF"
                    context.fillRect(b.x*BoxSize+3, b.y*BoxSize+3, BoxSize-5, BoxSize-5);
                    break
            }
        })

    }
    //CLICK ON BLOCK FUNCTION/////////////////////////////////////////////////////////////////////////////////////////
    let tapBox = (e:any,BoxesForTap:BoxesForTapType,indexOfBox:number,RandomIndex:Array<number>):void => {

        if (Math.floor(e.layerX / BoxSize) === BoxesForTap[indexOfBox].x
            && Math.floor(e.layerY / BoxSize) === BoxesForTap[indexOfBox].y
            && RandomIndex[RandomIndex.length - 1] === indexOfBox ) {
            BoxesForTap[indexOfBox] = {x: BoxesForTap[indexOfBox].x, y: BoxesForTap[indexOfBox].y, tappedBy: "User"}
            UserScore++;
            console.log("User TAP")
        } else {
            BoxesForTap[indexOfBox] = {x: BoxesForTap[indexOfBox].x, y: BoxesForTap[indexOfBox].y, tappedBy: "AI"}
            AIScore++
            console.log("AI TAP")
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    let TakeRandomNumber = (arrayLength:number) =>{
        return Math.floor(Math.random()*(arrayLength - 1))
    }

    let CheckRandomNumber = (arrayLength:number,RandomIndex:any) =>{

        let RandomNumber = TakeRandomNumber(arrayLength)
        if(RandomIndex.indexOf(RandomNumber) === -1){
            RandomIndex.push(RandomNumber)
        }
        else{
            CheckRandomNumber(arrayLength,RandomIndex)
        }
    }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    let drawGame = (delay:number,FieldSize:number):void =>{

        let BoxesForTap:BoxesForTapType|any = []

        for (let i = 0; i < FieldSize; i++) {
            for(let j = 0 ;j<FieldSize;j++)
                BoxesForTap.push({x:i, y:j, tappedBy: null})
        }

        let RandomIndex:Array<number> =[]

        let canvas: any = document.getElementById("GameWindow");
        let context:any = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        let RandomBoxForTap:number = 0
        canvas.addEventListener("mouseup",
            (e: any) => {
                tapBox(e,
                    BoxesForTap, RandomBoxForTap, RandomIndex);
            })

        SetGameStart(true)
        SetWinner(false)
        clearInterval()
        //INTERVAL FOR RERENDER///////////////////////////////////////////////////////////////////////////////////////
       let GameInterval = setInterval(()=> {
           //CHECKING USER SCORES/////////////////////////////////////////////////////////////////////////////////////
            if (UserScore > (FieldSize * FieldSize) / 2) {
                SetGameStart(false)
                let date = new Date() ;
                SetPlayAgain(true)
                axios.post("https://starnavi-frontend-test-task.herokuapp.com/winners",{id:Math.random(),
                    winner:Name,
                   date:date.toISOString()}).then(response=>{
                    SetWinners(response.data)
                })
                    clearInterval(GameInterval)
                SetWinner(Name)
            }
            //CHECKING COMPUTER SCORES////////////////////////////////////////////////////////////////////////////////
            else if (AIScore > (FieldSize * FieldSize) / 2) {
                SetGameStart(false)
                let date = new Date() ;
                SetPlayAgain(true)
                axios.post("https://starnavi-frontend-test-task.herokuapp.com/winners",{id:Math.random(),
                    winner:"Computer",
                    date:date.toISOString()}).then(response=>{
                    SetWinners(response.data)
                })
                clearInterval(GameInterval)
                SetWinner("Computer")
            }
            //IF USER OR COMPUTER SCORE <50%//////////////////////////////////////////////////////////////////////////
            else {
                //GETTING RANDOM NUMBER FOR SET IN ON SCREEN/////////////////////////////////////////////////////////
                CheckRandomNumber(BoxesForTap.length, RandomIndex)
                 RandomBoxForTap = RandomIndex[RandomIndex.length - 1]
                BoxesForTap[RandomBoxForTap] = {
                    x: BoxesForTap[RandomBoxForTap].x,
                    y: BoxesForTap[RandomBoxForTap].y,
                    tappedBy: "Wait"
                }
                ///////RENDER/////////////////////////////////////////////////////////////////////////////////////////
                buildTable(ScreenSize, BoxSize, BoxesForTap)
                /////////////////////////////////////////////////////////////////////////////////////////////////////

                ////CHECK OF USER TAP////////////////////////////////////////////////////////////////////////////////
                    setTimeout(()=>{
                        if (BoxesForTap[RandomBoxForTap].tappedBy === "Wait") {
                            BoxesForTap[RandomBoxForTap] = {
                                x: BoxesForTap[RandomBoxForTap].x,
                                y: BoxesForTap[RandomBoxForTap].y,
                                tappedBy: "AI"
                            }
                            ///ADDING SCORE TO COMPUTER IF USER DONT TAP ON CURRENT BLOCK////////////////////////////
                            AIScore++
                            console.log("AI")
                        }
                    },delay-100)
            }
        },delay)


    }
    return (
        <div className="row">
            <div className="col-6 mt-4">
                <div className={"row m-2 text-center"}>
                    <div className="col-3">
                        <select className={styles.selectG} onChange={(e)=>{ debugger ;// @ts-ignore
                            // @ts-ignore
                            setFieldSize(GameSettings![e.target.value].field) ;SetDelay(GameSettings![e.target.value].delay)}}>
                            <option value={"easyMode"} >Easy Mode</option>
                            <option value={"normalMode"} >Normal Mode</option>
                            <option value={"hardMode"} >Hard Mode</option>
                        </select>
                    </div>
                    <div className="col-3">
                        <input onChange={(e)=>{SetName(e.target.value)}} className={styles.inputG} value={Name}/>
                    </div>
                    <div className="col-3">
                        <button className={PlayAgain ? styles.playAgain  : styles.playBt}
                                onClick={()=>{drawGame(Delay,FieldSize)}}>{PlayAgain ? "Play Again" : "Play"}
                        </button>
                    </div>
                </div>
                <p className="text-center">Delay:{Timer}ms</p>
                {Winner ? <p className="text-center">{Winner} win</p>:null}
                <div className="text-center">
                    <canvas id={"GameWindow"} className="border" height={"500px"} width={"500px"}>

                    </canvas>
                </div>
            </div>


            <div className={"col-5 mt-3 "}>
                <p className="display-4">Leader Board</p>
                <div className={styles.leaderBoard}>
                {
                    Winners.map(winner=>{
                        return(

                            <div key={winner.id} className={"row ml-auto mr-auto mt-2 rounded p-2 " + styles.leaderBoardElem} >
                                <div className="col-6 rounded overflow-auto ">{winner.winner}</div>
                                <div className="col-6 rounded overflow-auto">{winner.date}</div>
                            </div>
                        )

                    })
                }
                </div>
            </div>
        </div>
    )
    }

export default App;
