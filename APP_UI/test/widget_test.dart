// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:app_ui/main.dart';

void main() {
  testWidgets('Splash screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: TrinetraApp()));

    // Verify that the splash screen shows "TRINETRA".
    expect(find.text('TRINETRA'), findsOneWidget);
    expect(find.text('0'), findsNothing);

    // Initial animations might need time, but find.text usually works if widget is in tree.
    // We won't test navigation or interaction in this smoke test.
  });
}
