Harmonize Prompt
================

This prompt aims to harmonize the writing style and details of the documentation of configuration files by providing this prompt and inspecting the Python script. It serves the `harmonize_configs` tool:

```bash
conda activate DashPy
cd /opt/dash/Dash-Server-Status-Dashboard-main
python -m tools.harmonize_configs
```

By default, once generated, the results of these promps are stored in `/staging/improve_description`.

If you change this prompt to go for a different writing style and wish to re-do all configuration, you need to delete the existing prompt results over ssh:

```python
rm /opt/dash/Dash-Server-Status-Dashboard-main/staging/improve_description/*.txt
```