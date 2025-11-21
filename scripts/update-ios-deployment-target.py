#!/usr/bin/env python3
"""
Update iOS deployment target to 13.0 for Capacitor 7+
"""
import os
import re
import sys

# Update Podfile - MUST be 13.0 for Capacitor 7+
podfile_path = "ios/App/Podfile"
if os.path.exists(podfile_path):
    with open(podfile_path, 'r') as f:
        content = f.read()
    
    # Update platform line
    if re.search(r'^platform :ios', content, re.MULTILINE):
        content = re.sub(r"^platform :ios, '[^']*'", "platform :ios, '13.0'", content, flags=re.MULTILINE)
        print("✅ Updated existing platform line")
    else:
        content = "platform :ios, '13.0'\n" + content
        print("✅ Added platform line")
    
    with open(podfile_path, 'w') as f:
        f.write(content)
    
    # Verify
    with open(podfile_path, 'r') as f:
        if "platform :ios, '13.0'" in f.read():
            print("✅ Podfile verified: platform :ios, '13.0'")
        else:
            print("❌ ERROR: Podfile update failed!")
            sys.exit(1)
else:
    print("❌ ERROR: Podfile not found after sync!")
    sys.exit(1)

# Update Xcode project
project_path = "ios/App/App.xcodeproj/project.pbxproj"
if os.path.exists(project_path):
    with open(project_path, 'r') as f:
        content = f.read()
    
    old_content = content
    content = re.sub(
        r'IPHONEOS_DEPLOYMENT_TARGET = [^;]*',
        'IPHONEOS_DEPLOYMENT_TARGET = 13.0',
        content
    )
    
    if old_content != content:
        with open(project_path, 'w') as f:
            f.write(content)
        print("✅ Xcode project updated: IPHONEOS_DEPLOYMENT_TARGET = 13.0")
    else:
        print("ℹ️ Xcode project already has IPHONEOS_DEPLOYMENT_TARGET = 13.0")
else:
    print("⚠️ Xcode project not found, skipping")

