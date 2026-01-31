import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';

class HexViewer extends StatefulWidget {
  final String fileId;
  final String backendUrl;

  const HexViewer({super.key, required this.fileId, required this.backendUrl});

  @override
  State<HexViewer> createState() => _HexViewerState();
}

class _HexViewerState extends State<HexViewer> {
  // Using a ListView.builder to simulate scrolling through large data
  // In reality we would fetch chunks. For simplicity, we are fetching small chunks on demand.
  
  // Cache mechanism could be better, but for now just fetch on demand.
  
  // Let's assume generic infinite list properties
  int _totalSize = 10000; // Placeholder until we get info
  final int _rowSize = 16;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          color: Colors.grey[900],
          child: Row(
            children: const [
              Text("Offset", style: TextStyle(color: Colors.green, fontFamily: 'Courier')),
              SizedBox(width: 16),
              Text("00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F", style: TextStyle(color: Colors.blueAccent, fontFamily: 'Courier')),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: (_totalSize / _rowSize).ceil(),
            itemBuilder: (context, index) {
              return HexRow(
                offset: index * _rowSize, 
                size: _rowSize, 
                fileId: widget.fileId, 
                backendUrl: widget.backendUrl
              );
            },
          ),
        ),
      ],
    );
  }
}

class HexRow extends StatefulWidget {
  final int offset;
  final int size;
  final String fileId;
  final String backendUrl;

  const HexRow({super.key, required this.offset, required this.size, required this.fileId, required this.backendUrl});

  @override
  State<HexRow> createState() => _HexRowState();
}

class _HexRowState extends State<HexRow> {
  String? _hexData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    if (!mounted) return;
    try {
      final response = await http.get(
        Uri.parse('${widget.backendUrl}/hex/${widget.fileId}?offset=${widget.offset}&size=${widget.size}')
      );
      
      if (response.statusCode == 200 && mounted) {
        final data = jsonDecode(response.body);
        setState(() {
          _hexData = data['hex'];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _hexData = "ERROR";
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final offsetHex = widget.offset.toRadixString(16).padLeft(8, '0').toUpperCase();
    
    // Format payload
    String hexString = "";
    String asciiString = "";
    
    if (_hexData != null && _hexData != "ERROR") {
      final bytes = _hexToBytes(_hexData!);
      hexString = bytes.map((b) => b.toRadixString(16).padLeft(2, '0').toUpperCase()).join(' ');
      asciiString = bytes.map((b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
    } else if (_loading) {
      hexString = "Loading...";
    } else {
      hexString = "Error";
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: Row(
        children: [
          Text(offsetHex, style: const TextStyle(color: Colors.green, fontFamily: 'Courier')),
          const SizedBox(width: 16),
          Expanded(child: Text(hexString, style: const TextStyle(color: Colors.white, fontFamily: 'Courier'))),
          const SizedBox(width: 16),
          SizedBox(
            width: 150,
            child: Text(asciiString, style: const TextStyle(color: Colors.yellow, fontFamily: 'Courier'))
          ),
        ],
      ),
    );
  }

  Uint8List _hexToBytes(String hex) {
    var result = Uint8List(hex.length ~/ 2);
    for (var i = 0; i < hex.length; i += 2) {
      var num = hex.substring(i, i + 2);
      var byte = int.parse(num, radix: 16);
      result[i ~/ 2] = byte;
    }
    return result;
  }
}
