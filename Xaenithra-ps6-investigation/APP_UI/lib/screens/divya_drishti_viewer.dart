import 'package:flutter/material.dart';
import '../core/constants.dart';

class DivyaDrishtiScreen extends StatelessWidget {
  const DivyaDrishtiScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Toolbar
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white.withValues(alpha: 0.5),
          child: Row(
            children: [
              Text("EVIDENCE VIEWER", style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              Switch(value: false, onChanged: (v) {}),
              const Text("HEX MODE"),
              const SizedBox(width: 16),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.search),
                label: const Text("STEGANOGRAPHY SCAN"),
              ),
            ],
          ),
        ),
        
        // Content Area
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock, size: 48, color: Colors.grey),
                const SizedBox(height: 16),
                Text("Select a file from the Inspector to view securely."),
                const SizedBox(height: 8),
                Text(
                  "SANDBOX ACTIVE",
                  style: TextStyle(color: AppColors.dharmaGreen, letterSpacing: 2, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
