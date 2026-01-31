import 'package:flutter/material.dart';
import '../core/constants.dart';

class GandivaScreen extends StatelessWidget {
  const GandivaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.cable, size: 64, color: AppColors.royalMaroon.withOpacity(0.5)),
        const SizedBox(height: 24),
        Text(
          "Connect Target Device",
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 16),
        Text(
          "Waiting for ADB / USB Handshake...",
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: Colors.grey[600],
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 32),
        ElevatedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.bolt),
          label: const Text("INITIATE GANDIVA PROTOCOL"),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.royalMaroon,
            foregroundColor: AppColors.ivoryBackground,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            textStyle: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
          ),
        ),
      ],
    );
  }
}
