import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Grid } from '@material-ui/core';
import React, { useState, useCallback, FunctionComponent, useEffect, SetStateAction, Dispatch } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import io from "socket.io-client";


enum GamePageView {
    MatchAnimals = 'match-animals',
    ChooseAPencil = 'choose-a-pencil',
    SpotTheOdd = 'spot-the-odd',
    ChooseABox = 'choose-a-box',
}

export type Dictionary<TKey extends string | number | symbol, TValue> = {
    [key in TKey]?: TValue;
};


const directionsList: Dictionary<GamePageView, string> = {
    [GamePageView.MatchAnimals]: 'Перетащи животное в его домик', //'Жираф, крокодил и бегемот жили в разных домиках. Жираф жил не в зеленом и не в синем домике. Крокодил жил не в зеленом и не в желтом. В каких домиках жили звери?',
    [GamePageView.ChooseAPencil]: 'Выбери карандаш',
    [GamePageView.SpotTheOdd]: 'Укажи лишнее',
    [GamePageView.ChooseABox]: 'Соедини предмет и его коробку', // 'В красной коробке лежит не кукла и не юла. В зеленой - не юла и не дудочка. В желтой - не кукла и не дудочка. Какой предмет лежит в каждой из коробок?'
};

interface Props {
    boxesImgIds: string[];
    correct: Dictionary<number, string>;
    defaultItems: { id, label, src, column }[];
    gameState: { view: number, prevDropEvent: any };
    setGameState: ({ view: number, prevDropEvent: any }) => void;
    socket: SocketIOClient.Socket;
}

const ChooseABox: FunctionComponent<Props> = (props) => {


    const { boxesImgIds, correct, defaultItems, gameState, setGameState, socket } = props;

    const [items, setItems] = useState(defaultItems);

    useEffect(() => {
        if (defaultItems.every((item, index) => items[index].src !== item.src)) {
            setItems(defaultItems);
        }
    }, [defaultItems]);

    console.log(`items = ${JSON.stringify(items)}`)


    const changeItemColumn = (currentItem, columnName) => {
        setItems((prevState) => {
            return prevState.map(e => {
                return {
                    ...e,
                    column: e.label === currentItem.label ? columnName : e.column,
                }
            })
        });
    };

    const content = (
        <Backdrop onClick={setGameState.bind(this, { ...gameState, view: 1 })}>
            <WinContainer>
                <img src={'img/d1.svg'} alt="puzzle" />
            </WinContainer>
        </Backdrop>
    );
        
    
    const MovableItem = ({ label, setItems, src }) => {

        const [{ isDragging }, drag] = useDrag({
            item: { label, type: 'Red' },
            end: (item, monitor) => {
                const dropResult = monitor.getDropResult();
            },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        });

        const opacity = isDragging ? 0.4 : 1;

        return (
            <StrappedImg ref={drag} className='movable-item' style={{ opacity }} src={src} />
        );
    };

    const Column = ({ children, className, title, src }) => {
        const [, drop] = useDrop({
            accept: 'Red',
            drop: (item) => {
                setGameState({ ...gameState, prevDropEvent: { children, title } });
                changeItemColumn(item, title);
                return ({ label: title })
            },
        });
        
        return (
            <ColumnWrapper ref={drop} className={className} >
                <ItemWrapper><StrappedImg src={src} /></ItemWrapper>
                {children}
            </ColumnWrapper>
        )
    };

    const Heap = ({ children, className, title }) => {
        const [, drop] = useDrop({
            accept: 'Red',
            drop: () => {
                console.log({ label: title });
                return ({ label: title })
            },
        });
        return (
            <HeapWrapper ref={drop} className={className} >
                {children}
            </HeapWrapper>
        )
    };

    const returnItemsForColumn = (columnName) => {
        
        return items.filter((item) => item.column === columnName)
            .map((item) => (
                <ItemWrapper>
                    <MovableItem key={item.id} label={item.label} setItems={setItems} src={item.src} />
                </ItemWrapper>
            ))
    }

    return (
        <>
            { items.every((item) => correct[item.id] == item.column) ? content : null }
            <Description item xs={12} justify="space-around" >{directionsList['choose-a-box']}</Description>
            <ButtonsRow item xs={12} justify="space-around">
                <DndProvider backend={HTML5Backend}>
                    <Heap title={'Куча'} className={'first-column'}>{returnItemsForColumn('Куча')}</Heap>
                    <Column title={'1'} src={boxesImgIds[0]} className={'second-column'}>{returnItemsForColumn('1')}</Column>
                    <Column title={'2'} src={boxesImgIds[1]} className={'third-column'}>{returnItemsForColumn('2')}</Column>
                    <Column title={'3'} src={boxesImgIds[2]} className={'fourth-column'}>{returnItemsForColumn('3')}</Column>
                </DndProvider>
            </ButtonsRow>
        </>
    );
};

const socket = io();

const games: FunctionComponent = () => {
    const [gameState, setGameState] = useState({
        view: 0,
        prevDropEvent: null,
    });


    useEffect(() => {

        const setupSocket = async () => {

            await fetch('/api/socketio');

            socket.connect();

            socket?.on('connect', () => {
                console.log('connect')
                socket.emit('hello')
            });
    
            socket?.on('update state', payload => {
                console.log('state updated: ', payload)
                setGameState(JSON.parse(payload))
            });
    
            socket?.on('a user connected', () => {
                console.log('a user connected')
            });
    
            socket?.on('disconnect', () => {
                console.log('disconnect')
            });
        };

        setupSocket();

        return () => {
            socket.close();
        }
    });

    const getGameProps = (view) => {

        switch (view) {
            // case 1:
            //     return ;

            // case 2:
            //     return ;

            case 1:
                return {
                    boxesImgIds: ['img/green-house.svg', 'img/yellow-house.svg', 'img/house-red.svg'],
                    correct: {
                        1: '1',
                        2: '3',
                        3: '2'
                    },
                    defaultItems: [
                        {id: 1, label: '1', src: 'img/giraffe.svg', column: 'Куча'},
                        {id: 2, label: '2', src: 'img/crocodile.svg', column: 'Куча'},
                        {id: 3, label: '3', src: 'img/hippopotamus.svg', column: 'Куча'},
                    ],
                };

            case 0:
            default:
                return {
                    boxesImgIds: ['img/green-box.svg', 'img/yellow-box.svg', 'img/red-box.svg'],
                    correct: {
                        1: '1',
                        2: '3',
                        3: '2'
                    },
                    defaultItems: [
                        { id: 1, label: '1', src: 'img/doll.svg', column: 'Куча' },
                        { id: 2, label: '2', src: 'img/shehnai.svg', column: 'Куча' },
                        { id: 3, label: '3', src: 'img/whirligig.svg', column: 'Куча' },
                    ],
                };
        }
    };

    // socket.emit("test-action", "This is test action");

    // socket.on("server-test-action", (payload) => {
    //     console.log(payload);
    // })

    const props = getGameProps(gameState.view);

    console.log(`props ${JSON.stringify(props)}`)

    return (
        <Container container justify={'center'} >
            <Wrapper container item wrap={'nowrap'} xs={6}>
            <ChooseABox {...props} gameState={gameState} setGameState={setGameState} socket={socket}/>
            <AltButtonsRow item xs={12} justify="space-around" >
                <Grid item xs={6}></Grid>
                <MiniButtons item xs={6}>
                    <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 0 })}>1</MiniButton>
                    <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 1 })}>2</MiniButton>
                    <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 2 })}>3</MiniButton>
                    <MiniButton onClick={setGameState.bind(this, { ...gameState, view: 3 })}>4</MiniButton>
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
    border: 0.1px solid #edf0f5;
    box-sizing: border-box;
    border:none;
    border-radius: 10px;
    width:100px;
    height:100px;
    cursor:pointer;
    &:hover {
        filter: invert(0.5);
        opacity: 0.1;
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
    flex:1;
    display: flex;
`;

const MiniButtons = styled(Grid)`
    align-self: center;
    display: flex;
    justify-content: space-evenly;
`;

const StrappedImg = styled.img`
    min-width: 70px;
    max-width: 80px;
    display: flex;
    justify-content: center;
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
    width: 100%;
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



const Button = styled.button`
    background: #C4C4C4;
    border: 1px solid #edf0f5;
    box-sizing: border-box;
    border-radius: 10px;
    width:100px;
    height:100px;
    &:hover {
        filter: invert(0.5);
    }
`;

const ItemWrapper = styled.div`
    background-color: white;
    border: 0.1px solid #edf0f5;
    box-sizing: border-box;
    border:none;
    border-radius: 10px;
    margin: 10px;
    padding:10px;
`;

const HeapWrapper = styled.div`
    // height: 150px;
    width: 250px;

    // margin: 20px;

    display: flex;
    justify-content: center;
    flex-wrap: wrap;
`;

const ColumnWrapper = styled.div`
    width: 110px;
    margin: 20px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
`;

