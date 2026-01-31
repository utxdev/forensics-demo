import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';

// Service to handle URL scanning. easy to upgrade to VirusTotal later.
class UrlScannerService {
  // Simple regex for demonstration. Upgrade this to an API call later.
  static final RegExp _urlRegex = RegExp(
    r'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)',
  );

  static bool containsSuspiciousUrl(String text) {
    return _urlRegex.hasMatch(text);
  }

  static List<String> extractUrls(String text) {
    return _urlRegex.allMatches(text).map((m) => m.group(0)!).toList();
  }
}

class MessageLogsScreen extends StatefulWidget {
  const MessageLogsScreen({super.key});

  @override
  State<MessageLogsScreen> createState() => _MessageLogsScreenState();
}

class _MessageLogsScreenState extends State<MessageLogsScreen> {
  static const platform = MethodChannel('com.example.call_logs/logs');
  List<Map<dynamic, dynamic>> _allMessages = [];
  List<Map<dynamic, dynamic>> _filteredMessages = [];
  bool _isLoading = false;
  String _errorMessage = '';

  // Filters
  final TextEditingController _searchController = TextEditingController();
  String _filterType = "All"; // All, INBOX, SENT
  DateTimeRange? _dateRangeFilter;
  bool _showSuspiciousOnly = false;

  @override
  void initState() {
    super.initState();
    _getMessages();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _getMessages() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      if (await _requestPermissions()) {
        final List<dynamic> result = await platform.invokeMethod('getMessages');
        final messages = result.cast<Map<dynamic, dynamic>>();
        setState(() {
          _allMessages = messages;
          _applyFilters();
        });
      } else {
        setState(() {
          _errorMessage = "Permission denied to access SMS or Contacts.";
        });
      }
    } on PlatformException catch (e) {
      setState(() {
        _errorMessage = "Failed to get messages: '${e.message}'.";
      });
    } catch (e) {
      setState(() {
        _errorMessage = "An unexpected error occurred: $e";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<bool> _requestPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.sms,
      Permission.contacts,
    ].request();
    return statuses[Permission.sms]?.isGranted ?? false;
  }

  void _applyFilters() {
    setState(() {
      _filteredMessages = _allMessages.where((msg) {
        final name = msg['name']?.toString().toLowerCase() ?? '';
        final sender = msg['address'].toString().toLowerCase();
        final body = msg['body'].toString().toLowerCase();
        final type = msg['type'].toString(); // INBOX or SENT
        final dateStr = msg['date'].toString();

        // Search Filter (Name, Address, Body)
        final query = _searchController.text.toLowerCase();
        bool matchesSearch =
            query.isEmpty ||
            name.contains(query) ||
            sender.contains(query) ||
            body.contains(query);

        // Suspicious Filter
        bool matchesSuspicious =
            !_showSuspiciousOnly ||
            UrlScannerService.containsSuspiciousUrl(msg['body']);

        // Type Filter
        bool matchesType = _filterType == "All" || type == _filterType;

        // Date Range Filter
        bool matchesDate = true;
        if (_dateRangeFilter != null) {
          try {
            // Parse format: dd-MM-yyyy HH:mm:ss
            // This is simplistic; for production, specific format parsing is safer than manual split
            // But existing code produces this fixed format in Native.
            // Let's use DateFormat if available or manual parse.
            // Since we didn't add intl package, manual parse:
            final parts = dateStr.split(' ');
            final dateParts = parts[0].split('-');
            final timeParts = parts[1].split(':');
            final dt = DateTime(
              int.parse(dateParts[2]), // Year
              int.parse(dateParts[1]), // Month
              int.parse(dateParts[0]), // Day
              int.parse(timeParts[0]), // Hour
              int.parse(timeParts[1]), // Minute
              int.parse(timeParts[2]), // Second
            );

            final start = _dateRangeFilter!.start;
            final end = _dateRangeFilter!.end.add(
              const Duration(days: 1),
            ); // Inclusive end day
            matchesDate = dt.isAfter(start) && dt.isBefore(end);
          } catch (e) {
            // If parsing fails, ignore date filter or include.
            // print("Date parse error: $e");
          }
        }

        return matchesSearch && matchesSuspicious && matchesType && matchesDate;
      }).toList();
    });
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      initialDateRange: _dateRangeFilter,
    );
    if (picked != null) {
      setState(() {
        _dateRangeFilter = picked;
      });
      _applyFilters();
    }
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text("Filter Messages"),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text("Message Type"),
                  DropdownButton<String>(
                    value: _filterType,
                    isExpanded: true,
                    items: ["All", "INBOX", "SENT"].map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => _filterType = val);
                        setState(
                          () => _filterType = val,
                        ); // Update main state immediately or on Apply
                      }
                    },
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: () async {
                      await _pickDateRange();
                      setDialogState(
                        () {},
                      ); // Refresh dialog UI to show selected range
                    },
                    child: Text(
                      _dateRangeFilter == null
                          ? "Select Date Range"
                          : "${_dateRangeFilter!.start.toString().split(' ')[0]} - ${_dateRangeFilter!.end.toString().split(' ')[0]}",
                    ),
                  ),
                  if (_dateRangeFilter != null)
                    TextButton(
                      onPressed: () {
                        setState(() => _dateRangeFilter = null);
                        setDialogState(() {});
                      },
                      child: const Text(
                        "Clear Date Filter",
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  const SizedBox(height: 10),
                  SwitchListTile(
                    title: const Text("Suspicious URLs Only"),
                    value: _showSuspiciousOnly,
                    contentPadding: EdgeInsets.zero,
                    onChanged: (val) {
                      setDialogState(() => _showSuspiciousOnly = val);
                      setState(() => _showSuspiciousOnly = val);
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    // Clear all filters
                    setState(() {
                      _filterType = "All";
                      _dateRangeFilter = null;
                      _showSuspiciousOnly = false;
                      _searchController.clear();
                    });
                    _applyFilters();
                    Navigator.pop(context);
                  },
                  child: const Text("Reset All"),
                ),
                ElevatedButton(
                  onPressed: () {
                    _applyFilters();
                    Navigator.pop(context);
                  },
                  child: const Text("Apply"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showMessageDetails(Map<dynamic, dynamic> msg) {
    final body = msg['body'] ?? '';
    final name = msg['name'];
    final address = msg['address'];
    final isSuspicious = UrlScannerService.containsSuspiciousUrl(body);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.message, color: Colors.blue),
            const SizedBox(width: 10),
            const Text("Message Details"),
            if (isSuspicious) ...[
              const Spacer(),
              const Icon(Icons.warning, color: Colors.orange),
            ],
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isSuspicious)
                Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.warning_amber, size: 20, color: Colors.orange),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Contains suspicious URL",
                          style: TextStyle(
                            color: Colors.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              if (name != null && name.isNotEmpty)
                _buildDetailRow("Name", name),
              _buildDetailRow("Sender", address),
              _buildDetailRow("Date", msg['date']),
              _buildDetailRow("Type", msg['type']),
              const Divider(),
              const Text(
                "Body:",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              SelectableText(body),
              if (isSuspicious) ...[
                const SizedBox(height: 10),
                const Text(
                  "Detected URLs:",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                ...UrlScannerService.extractUrls(body).map(
                  (url) =>
                      Text(url, style: const TextStyle(color: Colors.blue)),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Close"),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("$label: ", style: const TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value ?? "N/A")),
        ],
      ),
    );
  }

  Future<void> _exportMessages() async {
    if (_filteredMessages.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('No messages to export.')));
      return;
    }

    try {
      final StringBuffer csvContent = StringBuffer();
      // CSV Header
      csvContent.writeln("Address,Name,Date,Type,Body,IsSuspicious");

      for (var msg in _filteredMessages) {
        final address = msg['address']?.toString() ?? '';
        final name = msg['name']?.toString() ?? '';
        final date = msg['date']?.toString() ?? '';
        final type = msg['type']?.toString() ?? '';
        final body =
            msg['body']?.toString().replaceAll('\n', ' ') ??
            ''; // Remove newlines in body for CSV safety
        final isSuspicious = UrlScannerService.containsSuspiciousUrl(body)
            ? 'Yes'
            : 'No';

        // Escape commas in body or name if necessary, simplistic approach here:
        final cleanBody = body.contains(',') ? '"$body"' : body;
        final cleanName = name.contains(',') ? '"$name"' : name;

        csvContent.writeln(
          "$address,$cleanName,$date,$type,$cleanBody,$isSuspicious",
        );
      }

      final directory = await getTemporaryDirectory();
      final file = File('${directory.path}/message_logs.csv');
      await file.writeAsString(csvContent.toString());

      await Share.shareXFiles([XFile(file.path)], text: 'Message Logs');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to export messages: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: "Search messages...",
            hintStyle: TextStyle(color: Colors.white70),
            border: InputBorder.none,
            icon: Icon(Icons.search, color: Colors.white),
          ),
          onChanged: (val) => _applyFilters(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _exportMessages,
            tooltip: 'Export filtered logs',
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _getMessages),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(_errorMessage, textAlign: TextAlign.center),
              ),
            )
          : _filteredMessages.isEmpty
          ? const Center(child: Text("No messages found."))
          : ListView.builder(
              itemCount: _filteredMessages.length,
              itemBuilder: (context, index) {
                final msg = _filteredMessages[index];
                final isSuspicious = UrlScannerService.containsSuspiciousUrl(
                  msg['body'],
                );
                final name = msg['name'];
                final address = msg['address'];

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isSuspicious
                        ? Colors.orange.withValues(alpha: 0.2)
                        : Colors.blue.withValues(alpha: 0.2),
                    child: Icon(
                      Icons.message,
                      color: isSuspicious ? Colors.orange : Colors.blue,
                    ),
                  ),
                  title: Text(
                    (name != null && name.isNotEmpty)
                        ? name
                        : (address ?? "Unknown"),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (name != null && name.isNotEmpty && address != null)
                        Text(
                          address,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                      Text(
                        "${msg['date']}",
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                  trailing: isSuspicious
                      ? const Icon(Icons.warning, color: Colors.orange)
                      : null,
                  onTap: () => _showMessageDetails(msg),
                );
              },
            ),
    );
  }
}
