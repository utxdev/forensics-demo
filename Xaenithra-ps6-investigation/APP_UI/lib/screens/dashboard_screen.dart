import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:ui'; // For ImageFilter
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import 'indrajall_extraction.dart';
import 'sudarshana_analysis.dart';
import 'kaal_chakra_timeline.dart';
import 'divya_drishti_viewer.dart';
import 'chitragupta_report.dart';

// Navigation State Notifier
class CurrentModuleNotifier extends Notifier<String> {
  @override
  String build() => 'INDRAJALL';

  void set(String value) {
    state = value;
  }
}

final currentModuleProvider = NotifierProvider<CurrentModuleNotifier, String>(
  CurrentModuleNotifier.new,
);

// Overlay State
class OverlayNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void toggle() {
    state = !state;
  }

  void close() {
    state = false;
  }
}

final isOverlayOpenProvider = NotifierProvider<OverlayNotifier, bool>(
  OverlayNotifier.new,
);

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentModule = ref.watch(currentModuleProvider);
    final isOverlayOpen = ref.watch(isOverlayOpenProvider);

    Widget content;
    switch (currentModule) {
      case 'INDRAJALL':
        content = const IndrajallScreen();
        break;
      case 'SUDARSHANA':
        content = const SudarshanaScreen();
        break;
      case 'KAAL-CHAKRA':
        content = const KaalChakraScreen();
        break;
      case 'DIVYA-DRISHTI':
        content = const DivyaDrishtiScreen();
        break;
      case 'CHITRAGUPTA':
        content = const ChitraguptaScreen();
        break;
      default:
        content = const IndrajallScreen();
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // 1. MAIN CONTENT LAYER
          Container(
            decoration: const BoxDecoration(
              gradient: AppColors.cosmicVoidGradient,
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // Title Bar
                  _buildTitleBar(ref),

                  Expanded(
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: AppColors.neonCyan.withValues(alpha: 0.2),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.neonCyan.withValues(alpha: 0.1),
                            blurRadius: 30,
                            spreadRadius: -5,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                          child: content,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. OVERLAY LAYER
          if (isOverlayOpen)
            Positioned.fill(
              child: _buildOverlay(
                ref,
                currentModule,
              ).animate().fadeIn(duration: 300.ms).fadeIn(duration: 300.ms),
            ),
        ],
      ),
    );
  }

  Widget _buildOverlay(WidgetRef ref, String currentModule) {
    return GestureDetector(
      onTap: () => ref
          .read(isOverlayOpenProvider.notifier)
          .close(), // Close on tap outside
      child: Container(
        color: Colors.black.withValues(alpha: 0.6), // Dark dim background
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15), // Heavy blur
          child: Center(
            child: GestureDetector(
              onTap: () {}, // Catch taps inside content
              child: Container(
                constraints: const BoxConstraints(maxWidth: 400),
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppColors.glassPanel,
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(
                    color: AppColors.neonCyan.withValues(alpha: 0.3),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.neonCyan.withValues(alpha: 0.2),
                      blurRadius: 40,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Close Button
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        icon: const Icon(
                          Icons.close,
                          color: Colors.white70,
                          size: 30,
                        ),
                        onPressed: () =>
                            ref.read(isOverlayOpenProvider.notifier).close(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Logo
                    ShaderMask(
                      shaderCallback: (bounds) =>
                          AppColors.cyberVedicGradient.createShader(bounds),
                      child: const Icon(
                        Icons.remove_red_eye_rounded,
                        size: 80,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "TRINETRA",
                      style: AppTheme.darkGodTier.textTheme.displayLarge
                          ?.copyWith(fontSize: 32),
                    ),
                    const SizedBox(height: 40),

                    // Nav Items
                    _buildOverlayNavItem(
                      ref,
                      "INDRAJALL",
                      Icons.bolt,
                      currentModule == 'INDRAJALL',
                    ),
                    _buildOverlayNavItem(
                      ref,
                      "SUDARSHANA",
                      Icons.radar,
                      currentModule == 'SUDARSHANA',
                    ),
                    _buildOverlayNavItem(
                      ref,
                      "KAAL-CHAKRA",
                      Icons.hourglass_top,
                      currentModule == 'KAAL-CHAKRA',
                    ),
                    _buildOverlayNavItem(
                      ref,
                      "DIVYA-DRISHTI",
                      Icons.visibility,
                      currentModule == 'DIVYA-DRISHTI',
                    ),
                    _buildOverlayNavItem(
                      ref,
                      "CHITRAGUPTA",
                      Icons.description,
                      currentModule == 'CHITRAGUPTA',
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOverlayNavItem(
    WidgetRef ref,
    String label,
    IconData icon,
    bool isActive,
  ) {
    return GestureDetector(
      onTap: () {
        ref.read(currentModuleProvider.notifier).set(label);
        ref.read(isOverlayOpenProvider.notifier).close();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.neonCyan.withValues(alpha: 0.2)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: isActive
              ? Border.all(color: AppColors.neonCyan.withValues(alpha: 0.6))
              : Border.all(color: Colors.transparent),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isActive ? AppColors.neonCyan : Colors.white70,
              size: 28,
            ),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Rajdhani',
                fontSize: 20,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                color: isActive ? Colors.white : Colors.white70,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTitleBar(WidgetRef ref) {
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      alignment: Alignment.centerLeft,
      child: Row(
        children: [
          // Sidebar Toggle Button
          IconButton(
            icon: const Icon(
              Icons.grid_view_rounded, // Changed icon to grid/menu
              color: AppColors.neonCyan,
              size: 28,
            ),
            onPressed: () {
              ref.read(isOverlayOpenProvider.notifier).toggle();
            },
          ),
          const SizedBox(width: 12),
          const Text(
            "TRINETRA ///",
            style: TextStyle(
              color: AppColors.vedicGold,
              fontWeight: FontWeight.bold,
              fontSize: 18,
              letterSpacing: 1.2,
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.crimsonRed.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.crimsonRed),
            ),
            child: const Text(
              "OFFLINE MODE",
              style: TextStyle(
                color: AppColors.crimsonRed,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
