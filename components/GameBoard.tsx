import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cell } from '../constants/gameType';

interface GameBoardProps {
    board: Cell[][];
    gameOver: boolean;
    gameWon: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, gameOver, gameWon }) => {
    const renderCell = (cell: Cell) => {
        if (!cell.isRevealed) {
            return cell.isFlagged ? '🚩' : '■'; // Cuadrado sin revelar
        }
        // Si está revelada
        if (cell.isBomb) {
            return gameOver ? '💣' : '💥'; // Si perdió muestra bomba, sino explosión (esto es al final del juego)
        }
        // Si está revelada, no es bomba
        // Muestra el número si es > 0, sino un espacio (celda vacía)
        return cell.neighborBombs > 0 ? cell.neighborBombs.toString() : ' ';
    };

 const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) {
        return cell.isFlagged ? '#FFD700' : '#0f0'; // Bandera amarilla, Celda no revelada verde
    }
    // Si está revelada
    if (cell.isBomb) {
        return '#FF4500'; // Bomba roja anaranjada
    }
    // Si está revelada Y NO es bomba:
    if (cell.neighborBombs > 0) {
        // Colores específicos para números para mejor visibilidad
        switch (cell.neighborBombs) {
            case 1: return '#1E90FF'; // Azul claro
            case 2: return '#32CD32'; // Verde
            case 3: return '#DC143C'; // Rojo
            case 4: return '#4B0082'; // Índigo
            case 5: return '#8B0000'; // Rojo oscuro
            case 6: return '#40E0D0'; // Turquesa
            case 7: return '#000000'; // Negro
            case 8: return '#808080'; // Gris
            default: return '#FFFFFF'; // Blanco por defecto
        }
    }
    return '#FFF'; // Celda vacía revelada (0 bombas vecinas)
};

const getCellBackgroundColor = (cell: Cell) => {
    if (!cell.isRevealed) {
        return '#000'; // Fondo negro para celdas sin revelar
    }
    if (cell.isBomb) {
        return '#8B0000'; // Fondo rojo oscuro para bombas
    }
    // Celda revelada (no bomba)
    return '#333'; // Fondo gris más oscuro para mejor contraste
};


    return (
        <ScrollView
            horizontal={true} // Habilita scroll horizontal
            contentContainerStyle={styles.horizontalScroll}
            showsHorizontalScrollIndicator={true}
        >
            <View style={styles.container}>
                <View style={styles.rowNumbers}>
                    {/* Espacio para el número de fila inicial */}
                    <Text style={[styles.coordinateText, styles.emptyCorner]}></Text>
                    {board[0]?.map((_, col) => (
                        <Text key={`col-${col}`} style={styles.coordinateText}>
                            {col.toString().padStart(2, ' ')}
                        </Text>
                    ))}
                </View>

                {board.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.row}>
                        <Text style={styles.coordinateText}>
                            {rowIndex.toString().padStart(2, ' ')}
                        </Text>
                        {row.map((cell) => (
                            <Text
                                key={cell.id}
                                style={[
                                    styles.cell,
                                    { color: getCellColor(cell) },
                                    { backgroundColor: getCellBackgroundColor(cell) }, // Nuevo estilo para el fondo
                                ]}
                            >
                                {renderCell(cell)}
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    horizontalScroll: {
        paddingVertical: 10,
    },
    container: {
        marginVertical: 10,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    rowNumbers: {
        flexDirection: 'row',
        marginBottom: 2,
        paddingLeft: 22, // Ajustado para que las columnas 0, 1, 2... se alineen con las celdas
    },
    emptyCorner: {
        width: 20, // matching cell width
        height: 20, // matching cell height
        marginRight: 2,
    },
    cell: {
        width: 20,
        height: 20,
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: 16,
        marginRight: 2,
        fontWeight: 'bold', // Los números se ven mejor en negrita
    },
    // revealedCell style is no longer needed directly as its logic is merged into getCellBackgroundColor
    coordinateText: {
        width: 20,
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 12,
        marginRight: 2,
        textAlign: 'center',
    },
});

export default GameBoard;