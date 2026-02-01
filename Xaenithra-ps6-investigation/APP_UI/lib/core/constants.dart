import 'package:flutter/material.dart';

class AppColors {
  // Satya Yuga Palette (The Golden Age)
  static const Color ivoryBackground = Color(0xFFF8F5F2); // Temple Ivory
  static const Color vedicGold = Color(0xFFD4AF37);       // Divine Gold
  static const Color royalMaroon = Color(0xFF800000);     // Ancient Ink
  static const Color indraBlue = Color(0xFF1A237E);       // Cosmic Indigo
  static const Color agniOrange = Color(0xFFFF6B35);      // Sacred Fire (Accents)
  static const Color dharmaGreen = Color(0xFF2E7D32);     // Righteousness (Success)
  static const Color asuraRed = Color(0xFFB71C1C);        // Threat (Error)

  // Gradients
  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFD4AF37), Color(0xFFFFD700)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTextStyles {
  static const String headerFont = 'Cinzel'; // Regal, Roman-like
  static const String bodyFont = 'Inter';    // Clean, readable
  static const String codeFont = 'Fira Code'; // Technical
}
