import { ImageSourcePropType } from 'react-native';

export type ChessPieceKey =
  | 'wP'
  | 'wR'
  | 'wN'
  | 'wB'
  | 'wQ'
  | 'wK'
  | 'bP'
  | 'bR'
  | 'bN'
  | 'bB'
  | 'bQ'
  | 'bK';

export const pieceImages: Record<ChessPieceKey, ImageSourcePropType> = {
  wP: require('../../assets/chessSet/PNGs/No shadow/256h/w_pawn_png_256px.png'),
  wR: require('../../assets/chessSet/PNGs/No shadow/256h/w_rook_png_256px.png'),
  wN: require('../../assets/chessSet/PNGs/No shadow/256h/w_knight_png_256px.png'),
  wB: require('../../assets/chessSet/PNGs/No shadow/256h/w_bishop_png_256px.png'),
  wQ: require('../../assets/chessSet/PNGs/No shadow/256h/w_queen_png_256px.png'),
  wK: require('../../assets/chessSet/PNGs/No shadow/256h/w_king_png_256px.png'),
  bP: require('../../assets/chessSet/PNGs/No shadow/256h/b_pawn_png_256px.png'),
  bR: require('../../assets/chessSet/PNGs/No shadow/256h/b_rook_png_256px.png'),
  bN: require('../../assets/chessSet/PNGs/No shadow/256h/b_knight_png_256px.png'),
  bB: require('../../assets/chessSet/PNGs/No shadow/256h/b_bishop_png_256px.png'),
  bQ: require('../../assets/chessSet/PNGs/No shadow/256h/b_queen_png_256px.png'),
  bK: require('../../assets/chessSet/PNGs/No shadow/256h/b_king_png_256px.png'),
};

export const pieceLabels: Record<ChessPieceKey, string> = {
  wP: 'White Pawn',
  wR: 'White Rook',
  wN: 'White Knight',
  wB: 'White Bishop',
  wQ: 'White Queen',
  wK: 'White King',
  bP: 'Black Pawn',
  bR: 'Black Rook',
  bN: 'Black Knight',
  bB: 'Black Bishop',
  bQ: 'Black Queen',
  bK: 'Black King',
};

export const fileLabels = 'abcdefgh';
