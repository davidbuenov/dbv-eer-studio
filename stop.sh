#!/usr/bin/env bash
echo "Deteniendo servidor de desarrollo de dbv-eer-studio..."
pkill -f "vite" || true
