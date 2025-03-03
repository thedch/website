import { useCallback, useState, useEffect } from 'react';

const CloudflareTester: React.FC = () => {
    const [gameBoard, setGameBoard] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const fetchGameBoard = useCallback(async () => {
        try {
            const response = await fetch(`/kv-api?key=game-board`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setGameBoard(data.value || '0'.repeat(25));
            setError(null);
        } catch (error) {
            console.error('Error fetching game board:', error);
            setError('Failed to fetch game board');
        }
    }, []);

    const updateGameBoard = useCallback(async (index: number) => {
        const newBoard = gameBoard.split('');
        newBoard[index] = ((parseInt(newBoard[index]) + 1) % 3).toString();
        const updatedBoard = newBoard.join('');

        try {
            const response = await fetch('/kv-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key: 'game-board', value: updatedBoard }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setGameBoard(updatedBoard);
            setError(null);
        } catch (error) {
            console.error('Error updating game board:', error);
            setError('Failed to update game board');
        }
    }, [gameBoard]);

    useEffect(() => {
        fetchGameBoard();
    }, [fetchGameBoard]);

    const getCellColor = (value: string) => {
        switch (value) {
            case '0': return 'bg-blue-500 hover:bg-blue-600';
            case '1': return 'bg-red-500 hover:bg-red-600';
            case '2': return 'bg-green-500 hover:bg-green-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    return (
        <div className="game-board flex justify-center">
            {error && <div className="error text-red-500 mb-4">{error}</div>}
            <div className="grid grid-cols-5 gap-2 p-4 bg-gray-100 rounded-lg shadow-md w-fit">
                {gameBoard.split('').map((cell, index) => (
                    <div
                        key={index}
                        className={`
                            w-16 h-16
                            cursor-pointer
                            rounded-lg
                            border-2 border-gray-300
                            shadow-sm
                            transition-all duration-200 ease-in-out
                            hover:scale-105
                            flex items-center justify-center
                            ${getCellColor(cell)}
                        `}
                        onClick={() => updateGameBoard(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CloudflareTester;