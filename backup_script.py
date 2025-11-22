import shutil
import os
import datetime

def make_backup():
    source_dir = r"c:\Users\ricar\Documents\CSAPP\csapp"
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"csapp_backup_{timestamp}"
    # Save inside the source dir for now, as we are restricted
    backup_path = os.path.join(source_dir, backup_filename)
    
    def ignore_patterns(path, names):
        ignore_list = []
        for name in names:
            if name in ['node_modules', '.git', '__pycache__', 'dist', 'build', '.venv', 'venv', '.idea', '.vscode', 'postgres_data', 'redis_data']:
                ignore_list.append(name)
            elif name.endswith('.pyc') or name.endswith('.zip'):
                ignore_list.append(name)
        return ignore_list

    print(f"Creating backup at {backup_path}.zip...")
    try:
        # make_archive base_dir is relative to root_dir. 
        # root_dir is the directory to zip.
        shutil.make_archive(backup_path, 'zip', root_dir=source_dir)
        print(f"Backup created successfully: {backup_path}.zip")
    except Exception as e:
        print(f"Error creating backup: {e}")

if __name__ == "__main__":
    make_backup()
