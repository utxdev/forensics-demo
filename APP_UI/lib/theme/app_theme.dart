import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // CORE BACKGROUNDS (The Void)
  static const Color voidBlack = Color(0xFF05050A); // Deepest Black
  static const Color cosmicBlue = Color(0xFF0F172A); // Dark Midnight
  static const Color glassPanel = Color(0x1AFFFFFF); // 10% White for Glass

  // ACCENTS (The Divine & The Cyber)
  static const Color vedicGold = Color(0xFFFFD700); // Pure Gold
  static const Color neonCyan = Color(0xFF00F0FF); // Cyberpunk Blue
  static const Color cyberPurple = Color(0xFFBD00FF); // Mystical Purple

  // ALERTS
  static const Color crimsonRed = Color(0xFFFF2A6D); // Critical Error

  // GRADIENTS
  static const LinearGradient cyberVedicGradient = LinearGradient(
    colors: [vedicGold, neonCyan],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cosmicVoidGradient = LinearGradient(
    colors: [voidBlack, cosmicBlue],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}

class AppTheme {
  static ThemeData get darkGodTier {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.voidBlack,
      primaryColor: AppColors.vedicGold,

      // Font Family: Rajdhani (Futuristic) for UI, Cinzel (Ancient) for Headers
      textTheme: TextTheme(
        displayLarge: GoogleFonts.cinzel(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: AppColors.vedicGold,
            letterSpacing: 2.0,
            shadows: [
              const Shadow(color: AppColors.vedicGold, blurRadius: 10),
            ]),
        headlineMedium: GoogleFonts.rajdhani(
            fontSize: 24, fontWeight: FontWeight.w600, color: Colors.white),
        bodyLarge: GoogleFonts.rajdhani(fontSize: 16, color: Colors.white70),
      ),

      iconTheme: const IconThemeData(
        color: AppColors.neonCyan,
        size: 24,
      ),

      // Card Theme (Glassmprohic Default)
      cardTheme: CardThemeData(
        color: AppColors.glassPanel,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side:
              BorderSide(color: AppColors.neonCyan.withValues(alpha: 0.3), width: 1),
        ),
      ),
    );
  }
}
