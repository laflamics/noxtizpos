#!/usr/bin/env python3
"""
Update iOS deployment target to 14.0 for Capacitor 7.4+
Capacitor 7.4+ requires iOS 14.0 or higher
"""
import os
import re
import sys

# Update Podfile - MUST be 14.0 for Capacitor 7.4+
DEPLOYMENT_TARGET = "14.0"

podfile_path = "ios/App/Podfile"
if os.path.exists(podfile_path):
    with open(podfile_path, 'r') as f:
        content = f.read()
    
    # Update platform line
    if re.search(r'^platform :ios', content, re.MULTILINE):
        content = re.sub(r"^platform :ios, '[^']*'", f"platform :ios, '{DEPLOYMENT_TARGET}'", content, flags=re.MULTILINE)
        print(f"✅ Updated existing platform line to {DEPLOYMENT_TARGET}")
    else:
        content = f"platform :ios, '{DEPLOYMENT_TARGET}'\n" + content
        print(f"✅ Added platform line: {DEPLOYMENT_TARGET}")
    
    with open(podfile_path, 'w') as f:
        f.write(content)
    
    # Verify
    with open(podfile_path, 'r') as f:
        if f"platform :ios, '{DEPLOYMENT_TARGET}'" in f.read():
            print(f"✅ Podfile verified: platform :ios, '{DEPLOYMENT_TARGET}'")
        else:
            print("❌ ERROR: Podfile update failed!")
            sys.exit(1)
else:
    print("❌ ERROR: Podfile not found after sync!")
    print(f"Current directory: {os.getcwd()}")
    print(f"Looking for: {os.path.abspath(podfile_path)}")
    if os.path.exists("ios"):
        print("ios/ directory exists")
        if os.path.exists("ios/App"):
            print("ios/App/ directory exists")
            print(f"Files in ios/App/: {os.listdir('ios/App')}")
    sys.exit(1)

# Update Xcode project
project_path = "ios/App/App.xcodeproj/project.pbxproj"
if os.path.exists(project_path):
    with open(project_path, 'r') as f:
        content = f.read()
    
    old_content = content
    content = re.sub(
        r'IPHONEOS_DEPLOYMENT_TARGET = [^;]*',
        f'IPHONEOS_DEPLOYMENT_TARGET = {DEPLOYMENT_TARGET}',
        content
    )
    
    if old_content != content:
        with open(project_path, 'w') as f:
            f.write(content)
        print(f"✅ Xcode project updated: IPHONEOS_DEPLOYMENT_TARGET = {DEPLOYMENT_TARGET}")
    else:
        print(f"ℹ️ Xcode project already has IPHONEOS_DEPLOYMENT_TARGET = {DEPLOYMENT_TARGET}")
else:
    print("⚠️ Xcode project not found, skipping")

