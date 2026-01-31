import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:audioplayers/audioplayers.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'dart:async';

class CinematicSplashScreen extends StatefulWidget {
  const CinematicSplashScreen({super.key});

  @override
  State<CinematicSplashScreen> createState() => _CinematicSplashScreenState();
}

class _CinematicSplashScreenState extends State<CinematicSplashScreen> {
  final AudioPlayer _audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _playCinematicIntro();
  }

  Future<void> _playCinematicIntro() async {
    // 1. Play "Om" Chant or low drone (Placeholder code - user needs to add 'chant.mp3')
    try {
      await _audioPlayer.setSource(AssetSource('audio/chant.mp3'));
      await _audioPlayer.setVolume(0.5);
      await _audioPlayer.resume();
    } catch (e) {
      debugPrint("Audio asset not found, proceding without sound.");
    }

    // 2. Navigate after 5 seconds
    Timer(const Duration(seconds: 5), () {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const DashboardScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
             return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 1500),
        ),
      );
    });
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.voidBlack,
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
             image: AssetImage('assets/images/background.png'),
             fit: BoxFit.cover,
             opacity: 0.4,
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // 1. THE TRINETRA LOGO (Pulse Effect)
              Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: AppColors.vedicGold.withOpacity(0.5), blurRadius: 50, spreadRadius: 10),
                    BoxShadow(color: AppColors.neonCyan.withOpacity(0.3), blurRadius: 100, spreadRadius: 20),
                  ],
                ),
                child: Image.asset('assets/images/trinetra_logo.png'),
              )
              .animate(onPlay: (controller) => controller.repeat(reverse: true))
              .scale(duration: 2000.ms, begin: const Offset(1, 1), end: const Offset(1.1, 1.1))
              .then()
              .shimmer(duration: 2000.ms, color: AppColors.vedicGold),

              const SizedBox(height: 50),

              // 2. TEXT REVEAL (Cinematic)
              Text("TRINETRA", style: AppTheme.darkGodTier.textTheme.displayLarge)
              .animate()
              .fadeIn(duration: 2000.ms, curve: Curves.easeIn)
              .moveY(begin: 20, end: 0)
              .then()
              .tint(color: AppColors.vedicGold),

              const SizedBox(height: 20),

              Text("GOD-TIER FORENSICS", style: AppTheme.darkGodTier.textTheme.bodyLarge?.copyWith(letterSpacing: 5))
              .animate(delay: 1000.ms)
              .fadeIn(duration: 1500.ms)
              .moveY(begin: 10, end: 0),
              
              const SizedBox(height: 100),
              
              // 3. LOADING INDICATOR
              SizedBox(
                width: 50,
                height: 50,
                child: CircularProgressIndicator(color: AppColors.neonCyan, strokeWidth: 2),
              ).animate(delay: 2000.ms).fadeIn(),
            ],
          ),
        ),
      ),
    );
  }
}
