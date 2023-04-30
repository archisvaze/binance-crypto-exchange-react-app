import { useEffect, useMemo, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { SelectPicker } from 'rsuite';

const data = [
    { label: 'Bitcoin', value: 'btcusdt@aggTrade' },
    { label: 'Dogecoin', value: 'dogeusdt@aggTrade' },
];

export default function App() {
    const [prevSymbol, setPrevSymbol] = useState();
    const [symbol, setSymbol] = useState();
    const [latestPrice, setLatestPrice] = useState();

    const socketUrl = 'wss://stream.binance.com:9443/stream';

    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl, {
        onOpen: () => console.log('opened'),
        //Will attempt to reconnect on all close events, such as server shutting down
        shouldReconnect: (e, symbol) => {
            console.log(e);
            return true;
        },
    });

    const messageHistory = useRef([]);

    messageHistory.current = useMemo(() => messageHistory.current.concat(lastJsonMessage ?? []), [lastJsonMessage]);

    const handleClickSendMessage = () => {
        sendJsonMessage({
            method: 'SUBSCRIBE',
            params: [symbol],
            id: 345,
        });
    };

    const handleClickUnSendMessage = () => {
        sendJsonMessage({
            method: 'UNSUBSCRIBE',
            params: [symbol],
            id: 345,
        });
    };

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    useEffect(() => {
        console.log(connectionStatus);
    }, [connectionStatus]);

    useEffect(() => {
        console.log(messageHistory?.current);
        if (messageHistory?.current.length > 2 && connectionStatus === 'Open') {
            if (messageHistory?.current[messageHistory?.current.length - 1].stream && symbol) {
                const res = JSON.parse(JSON.stringify(messageHistory?.current));
                let currSymbol = JSON.parse(JSON.stringify(symbol));
                setPrevSymbol(currSymbol);
                setLatestPrice(res[res.length - 1].data?.p);
                setSymbol();
            }
        }
    }, [messageHistory?.current]);

    useEffect(() => {
        console.log('symbol', symbol);
        if (symbol) {
            handleClickSendMessage();
        }
        if (prevSymbol) {
            setSymbol();
            handleClickUnSendMessage();
        }
    }, [symbol, prevSymbol]);

    return (
        <div className='App'>
            <button
                onClick={handleClickSendMessage}
                disabled={readyState !== ReadyState.OPEN}
            >
                Subscribe
            </button>
            <button
                onClick={handleClickUnSendMessage}
                disabled={readyState !== ReadyState.OPEN}
            >
                Unsubscribe
            </button>
            <button>Send Message</button>
            <span>The WebSocket is currently {connectionStatus}</span>

            <SelectPicker
                value={symbol}
                onChange={setSymbol}
                onClean={() => {
                    setSymbol();
                }}
                data={data}
                style={{ width: 224 }}
            />

            {lastJsonMessage ? <span>Last message: {JSON.stringify(lastJsonMessage.data, null, 4)}</span> : null}

            <h1>{`${prevSymbol}: ${latestPrice}`}</h1>
        </div>
    );
}
