import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Grid } from '@material-ui/core';
import React, { useState, useEffect, FunctionComponent } from 'react';
import io, { Socket } from 'socket.io-client';

enum GamePageView {
    MatchAnimals = 'img/e3.png',
    ChooseAPencil = 'img/a1.png',
    SpotTheOdd = 'spot-the-odd',
    ChooseABox = 'choose-a-box',
}

export type Dictionary<TKey extends string | number | symbol, TValue> = {
    [key in TKey]?: TValue;
};

const directionsList: Dictionary<GamePageView, string> = {
    [GamePageView.MatchAnimals]: 'Укажи коробку', // 'Перетащи животное в его домик', //'Жираф, крокодил и бегемот жили в разных домиках. Жираф жил не в зеленом и не в синем домике. Крокодил жил не в зеленом и не в желтом. В каких домиках жили звери?',
    [GamePageView.ChooseAPencil]: 'Выбери карандаш',
    [GamePageView.SpotTheOdd]: 'Укажи лишнее',
    [GamePageView.ChooseABox]: 'Перетащи предмет в коробку', // 'В красной коробке лежит не кукла и не юла. В зеленой - не юла и не дудочка. В желтой - не кукла и не дудочка. Какой предмет лежит в каждой из коробок?'
};


const ChooseAPencil: FunctionComponent<{ imgIds: string[], correct: string, gameState, setGameState, socket }> = ({ imgIds, correct, gameState, setGameState, socket }) => {

    const content = (imgId) => (
        <Backdrop onClick={() => setGameState({ ...gameState, prevSelectedButton: null })}>
            <WinContainer>
            <img src={imgId} alt="puzzle"  />
            </WinContainer>
        </Backdrop>
    );

    const handleClick = (imgId) => {
        setGameState({ ...gameState, prevSelectedButton: imgId });
        console.log(`isCorrect = ${imgId === correct}`);
        socket.emit('update state', JSON.stringify(gameState));
    };

    return (
        <>
            { (gameState.prevSelectedButton === correct) ? content(gameState.prevSelectedButton) : null }
            <Description item xs={12} justify="space-around" >{directionsList[correct]}</Description>
            <ButtonsRow item xs={12} justify="space-around">
                {imgIds.map((imgId) => (
                    <SpotTheOddButton key={imgId} onClick={() => handleClick(imgId)}>
                        <StrappedImg src={imgId} />
                    </SpotTheOddButton>
                ))}
            </ButtonsRow>
        </>
    );
};

// setPageView={setPageView} 

const games: FunctionComponent = () => {
    const [gameState, setGameState] = useState({
        view: 0,
        prevSelectedButton: null,
    });

    // const [socket, setSocket] = useState(null);

    const socket = io();

    useEffect(() => {

        const setupSocket = async () => {

            await fetch('/api/socketio');

            socket?.on('connect', () => {
                console.log('connect')
                socket.emit('hello')
            })
    
            socket?.on('update state', payload => {
                console.log('state updated: ', payload)
                //setGameState(JSON.parse(payload))
            })
    
            socket?.on('a user connected', () => {
                console.log('a user connected')
            })
    
            socket?.on('disconnect', () => {
                console.log('disconnect')
            })
        };

        setupSocket();
    });


    const getGameProps = (view) => {

        switch (view) {
            // case 0:
            //     return {
            //         imgIds: ['img/c1.svg', 'img/c2.svg', 'img/c3.svg', 'img/c4.svg'],
            //         correct: 'img/c4.svg'
            //     }
            case 2:
                return {
                    imgIds: ['img/f1.png', 'img/f4.png', 'img/f3.png', 'img/f2.png'],
                    correct: 'img/f3.png'
                }
            case 1:
                return {
                    imgIds: ['img/e1.png', 'img/e2.png', 'img/e3.png', 'img/e4.png'],
                    correct: 'img/e3.png'
                }
            case 0:
            default:
                return {
                    imgIds: ['img/a1.png', 'img/a2.png', 'img/a3.png', 'img/a4.png'],
                    correct: 'img/a2.png'
                };
        }
    };

    return (
        <Container container justify={'center'}>
            <Wrapper container wrap={'nowrap'} xs={6}>
                <ChooseAPencil {...getGameProps(gameState.view)} gameState={gameState} setGameState={setGameState} socket={socket} />
                <AltButtonsRow item xs={12} justify="space-around" >
                    <Grid item xs={6}></Grid>
                    <MiniButtons item xs={6}>
                        <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 0 })}></MiniButton>
                        <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 1 })}></MiniButton>
                        <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 2 })}></MiniButton>
                        <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 3 })}></MiniButton>
                    </MiniButtons>
                </AltButtonsRow>
            </Wrapper>
        </Container>
    );
};

export default games;

const Container = styled(Grid)`
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    overflow: auto;
    align-content: center;
`;

const Wrapper = styled(Grid)`
    background-image: url(/excercise-background.png);
    background-size: cover;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    display: flex;
    height: 60%;
`;

const Description = styled(Grid)`
    flex: 1;
    display: flex;
    align-items: center;
    align-content: center;
    font-weight: 400;
    font-size: 14px;
    text-align: center;
    padding: 20px;
    line-height: 22px;
`;

const ButtonsRow = styled(Grid)`
    display: flex;
    flex:1;
    align-items: center;
    align-content: center;
`;

const SpotTheOddButton = styled.button`
background-color: white;
box-sizing: border-box;
border: none;
border-radius: 10px;
width:100px;
height:100px;
cursor:pointer;
&:hover {
    opacity: 0.9;
    border: 0.3px solid #edf0f5;
}
&:active {
    border:none;
}
`;

const MiniButton = styled.button`
background: lightblue;
opacity: 0.9;
font-weight: 400;
font-size: 14px;
border: 0.1px solid #edf0f5;
box-sizing: border-box;
border-radius: 10px;
width: 70px;
height: 70px;
box-shadow: inset 2px 2px 3px rgba(255, 255, 255, .3),
            inset -2px -2px 3px rgba(0, 0, 0, .3);
&:hover {
    filter: invert(0.1);
    opacity: 0.8;
}
&:active {
    box-shadow: inset -2px -2px 3px rgba(255, 255, 255, .3),
                inset 2px 2px 3px rgba(0, 0, 0, .3);
}
`;

const AltButtonsRow = styled(Grid)`
    flex: 1;
    display: flex;
`;

const MiniButtons = styled(Grid)`
    align-self: center;
    display: flex;
    justify-content: space-evenly;
`;

const StrappedImg = styled.img`
    max-height: 70px;
    max-width: 50px;
    display: flex;
    justify-content: center;
    margin: auto;
`;

const rotate = keyframes`
100% {
  transform: rotate(1turn);
}
`;

let height = 450;

const WinContainer = styled.div`
  margin: 0 auto;
  width: ${height}px;
  //height:${height}px;
  display: flex;
  justify-content: center;
  align-items: center;
  // position: relative;
  z-index: 1;

  position: absolute;
  top: calc(50% - 100px);
  left: calc(50% - 100px);
  height: 200px;
  width: 200px;


  border-radius: 10px;
  overflow: hidden;
  padding: 1rem;
  background: lightblue;
  > img {
    height: 100%;
    background: lightblue;
  }
  &::before {
    content: "";
    position: absolute;
    z-index: -2;
    left: -50%;
    top: -50%;
    width: 200%;
    height: 200%;
    background-color: #399953;
    background-repeat: no-repeat;
    background-size: 50% 50%, 50% 50%;
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-image: linear-gradient(#399953, #399953),
      linear-gradient(#fbb300, #fbb300), linear-gradient(#d53e33, #d53e33),
      linear-gradient(#377af5, #377af5);
    animation: ${rotate} 4s linear infinite;
  }
  &::after {
    content: "";
    position: absolute;
    z-index: -1;
    left: 6px;
    top: 6px;
    width: calc(100% - 12px);
    height: calc(100% - 12px);
    background: white;
    border-radius: 5px;
  }
`;

const Backdrop = styled.div`
    :after {
        content: "";
        background-color: lightblue;
        opacity: 0.5;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        position: absolute;
        z-index: 0;   
    }
`;
