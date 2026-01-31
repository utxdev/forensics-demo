import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart'; // Correctly placed
import 'screens/dashboard_screen.dart';

import 'dart:io';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Desktop Window Configuration
  if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
    await windowManager.ensureInitialized();
    WindowOptions windowOptions = const WindowOptions(
      size: Size(1280, 800),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden, // Custom Window Frame
    );
    
    windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.focus();
    });
  }

  runApp(const ProviderScope(child: TrinetraApp()));
}

class TrinetraApp extends StatelessWidget {
  const TrinetraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Trinetra Forensics',
      debugShowCheckedModeBanner: false,


      theme: AppTheme.darkGodTier,
      home: const CinematicSplashScreen(),
    );
  }
}
