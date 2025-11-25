#!/bin/bash
# Script to capture backend logs for debugging
echo "Capturando logs do backend..."
sudo tail -200 /proc/456904/fd/1 2>&1 | grep -E "GET_CURRENT_USER|LIST_ACCOUNTS|organization" -A 10 -B 2 | tail -100
