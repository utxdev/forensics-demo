package com.antigravity.gandiva.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.antigravity.gandiva.ui.MainViewModel
import com.antigravity.gandiva.ui.UiState
import com.antigravity.gandiva.ui.theme.*
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.MultiplePermissionsState
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    permissionState: MultiplePermissionsState
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(DarkBackground, SurfaceDark)))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Text(
            text = "GANDIVA",
            color = NeonBlue,
            style = MaterialTheme.typography.displayMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 32.dp)
        )
        Text(
            text = "FORENSIC EXTRACTION UTILITY",
            color = NeonBlue.copy(alpha = 0.7f),
            style = MaterialTheme.typography.labelMedium,
            letterSpacing = 4.sp
        )

        Spacer(modifier = Modifier.weight(1f))

        // Center Stage: The Bow
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(300.dp)
        ) {
            BowAnimation(isFiring = uiState.isExtracting)
        }

        Spacer(modifier = Modifier.weight(1f))

        // Request Permissions / Start Button
        if (!permissionState.allPermissionsGranted) {
            Button(
                onClick = { permissionState.launchMultiplePermissionRequest() },
                colors = ButtonDefaults.buttonColors(containerColor = NeonPurple)
            ) {
                Text("INITIALIZE PROTOCOL (GRANT PERMISSIONS)")
            }
        } else {
            if (!uiState.isExtracting) {
                Button(
                    onClick = { viewModel.startExtraction() },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = NeonBlue)
                ) {
                    Text("DRAW GANDIVA")
                }
            } else {
                ExtractionMonitor(uiState)
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun BowAnimation(isFiring: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "bow_pulse")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ), label = "pulse"
    )

    val drawState by animateFloatAsState(
        targetValue = if (isFiring) 50f else 0f,
        animationSpec = tween(1000, easing = LinearEasing), label = "draw"
    )

    Canvas(modifier = Modifier.fillMaxSize()) {
        val center = Offset(size.width / 2, size.height / 2)
        val bowRadius = size.width / 3 * pulse

        // 1. Draw The Bow (Arc)
        // Neon Blue Glow
        drawArc(
            brush = Brush.horizontalGradient(listOf(NeonBlue, NeonGreen)),
            startAngle = 140f,
            sweepAngle = 260f,
            useCenter = false,
            topLeft = Offset(center.x - bowRadius, center.y - bowRadius),
            size = androidx.compose.ui.geometry.Size(bowRadius * 2, bowRadius * 2),
            style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
        )

        // 2. Draw The String
        // The string pulls back based on 'drawState'
        val stringTop = Offset(
            center.x + bowRadius * cos(Math.toRadians(140.0)).toFloat(),
            center.y + bowRadius * sin(Math.toRadians(140.0)).toFloat()
        )
        val stringBottom = Offset(
            center.x + bowRadius * cos(Math.toRadians(140.0 + 260.0)).toFloat(),
            center.y + bowRadius * sin(Math.toRadians(140.0 + 260.0)).toFloat()
        )
        val stringCenter = Offset(center.x - drawState, center.y) // Pull back

        val path = Path().apply {
            moveTo(stringTop.x, stringTop.y)
            lineTo(stringCenter.x, stringCenter.y)
            lineTo(stringBottom.x, stringBottom.y)
        }

        drawPath(
            path = path,
            color = NeonPurple,
            style = Stroke(width = 2.dp.toPx())
        )

        // 3. Draw Arrows (Particles) if firing
        if (isFiring) {
            // Draw a central arrow ready to loose
            drawLine(
                color = NeonOranged, // Typo fixed in next tool call? No, will use Color.Red for now or define NeonOrange
                start = stringCenter,
                end = Offset(stringCenter.x + 100f, center.y),
                strokeWidth = 4.dp.toPx(),
                cap = StrokeCap.Round
            )
        }
    }
}

// Helper val for orange since I can't easily edit Color.kt right now inside this file
val NeonOranged = Color(0xFFFF9100)

@Composable
fun ExtractionMonitor(state: UiState) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = state.lastItemExtracted,
            color = NeonGreen,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatItem("MESSAGES", state.smsCount, NeonBlue)
            StatItem("APPS", state.appCount, NeonPurple)
            StatItem("MEDIA", state.mediaCount, NeonOranged)
            StatItem("LOCATIONS", state.locationCount, NeonGreen)
        }
    }
}

@Composable
fun StatItem(label: String, value: Int, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value.toString(),
            color = color,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            color = Color.White.copy(alpha = 0.5f),
            style = MaterialTheme.typography.labelSmall
        )
    }
}
