import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cell } from '../constants/gameType';
import { Colors } from '../constants/Colors';

interface GameBoardProps {
  board: Cell[][];
  gameOver: boolean;
  gameWon: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, gameOver, gameWon }) => {
  const renderCell = (cell: Cell) => {
    if (!cell.isRevealed) {
      return cell.isFlagged ? '🚩' : '■';
    }
    if (cell.isBomb) return gameOver ? '💣' : '💥';
    return cell.neighborBombs > 0 ? cell.neighborBombs.toString() : ' ';
  };

  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) return cell.isFlagged ? '#ff0' : '#0f0';
    if (cell.isBomb) return '#f00';
    return '#0f0';
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowNumbers}>
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
                cell.isRevealed && !cell.isBomb && styles.revealedCell,
              ]}
            >
              {renderCell(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingLeft: 24,
  },
  cell: {
    width: 20,
    height: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 16,
    marginRight: 2,
  },
  revealedCell: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
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
