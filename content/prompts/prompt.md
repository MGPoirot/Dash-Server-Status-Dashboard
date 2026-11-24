Prompts
=======

The processes of generating monitoring scripts and config configuration file using `add_metric`, and improving consistency of descriptions, tags and labels using `harmonize_labels` are fully automated through the use of prompts and LLMs. For adding a metric, one *super prompt*, shown below, is sent that combines the configs and script requirements and server profile. Similarly for harmonizing the labels, two super prompts are provided below. 

*   🖥️ [Server Profile](/server)
*   🗃️ [Configs](/config)
*   🐍 [Script](/script)
*   📝 [Harmonize descriptions](/harmonize)
*   🏷️ [Relabel labels and tags](/relabel)