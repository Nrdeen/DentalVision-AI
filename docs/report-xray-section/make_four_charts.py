"""Build report charts for the four enabled panoramic specialists."""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parent
plt.rcParams.update(
    {
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "font.size": 11,
    }
)


def save_metric_bars(path: Path, title: str, values: dict[str, float]) -> None:
    labels = list(values)
    nums = list(values.values())
    colors = ["#0f766e", "#0f766e", "#0e7490", "#4f46e5"][: len(labels)]
    fig, ax = plt.subplots(figsize=(8.4, 4.4), dpi=160)
    bars = ax.bar(labels, nums, color=colors, width=0.62)
    ax.set_ylim(0, 105)
    ax.set_ylabel("%")
    ax.set_title(title)
    ax.axhline(90, color="#b45309", linewidth=1.1, linestyle="--", label="gate mAP50 = 90")
    for bar, n in zip(bars, nums):
        ax.text(bar.get_x() + bar.get_width() / 2, n + 1.4, f"{n:.1f}", ha="center", va="bottom", fontsize=10)
    ax.legend(frameon=False, loc="lower right")
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def save_four_map() -> None:
    names = ["Impaction\n(ToothTruth)", "Implant\n(OralXrays)", "Restorations\n(OralXrays)", "Missing\n(OralXrays)"]
    map50 = [95.5, 99.0, 94.4, 97.0]
    colors = ["#334155", "#0f766e", "#0e7490", "#4f46e5"]
    fig, ax = plt.subplots(figsize=(9.2, 4.8), dpi=160)
    bars = ax.bar(names, map50, color=colors, width=0.62)
    ax.set_ylim(0, 110)
    ax.set_ylabel("mAP50 (%)")
    ax.set_title("Four enabled panoramic specialists — validation mAP50")
    ax.axhline(90, color="#b45309", linewidth=1.2, linestyle="--", label="product gate = 90")
    for bar, n in zip(bars, map50):
        ax.text(bar.get_x() + bar.get_width() / 2, n + 1.6, f"{n:.1f}", ha="center", fontsize=11)
    ax.legend(frameon=False)
    fig.tight_layout()
    fig.savefig(OUT / "four-enabled-map50.png")
    plt.close(fig)


def save_four_all_metrics() -> None:
    labels = ["Precision", "Recall", "mAP50", "mAP50-95"]
    series = {
        "Implant": [98.6, 99.0, 99.0, 82.6],
        "Restorations": [90.9, 92.2, 94.4, 75.6],
        "Missing": [91.7, 93.0, 97.0, 61.0],
        "Impaction*": [np.nan, np.nan, 95.5, np.nan],
    }
    x = np.arange(len(labels))
    width = 0.2
    fig, ax = plt.subplots(figsize=(10.2, 5.0), dpi=160)
    offsets = [-1.5, -0.5, 0.5, 1.5]
    colors = ["#0f766e", "#0e7490", "#4f46e5", "#334155"]
    for (name, vals), off, color in zip(series.items(), offsets, colors):
        ax.bar(x + off * width, vals, width, label=name, color=color)
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 110)
    ax.set_ylabel("%")
    ax.set_title("Validation metrics of the four enabled specialists")
    ax.axhline(90, color="#b45309", linewidth=1.1, linestyle="--")
    ax.legend(frameon=False, ncol=4, loc="upper right")
    fig.tight_layout()
    fig.savefig(OUT / "four-enabled-all-metrics.png")
    plt.close(fig)


if __name__ == "__main__":
    save_metric_bars(
        OUT / "missing-00-best-metrics.png",
        "Missing teeth best.pt (epoch 27, validated after epoch 42)",
        {"Precision": 91.7, "Recall": 93.0, "mAP50": 97.0, "mAP50-95": 61.0},
    )
    save_metric_bars(
        OUT / "impaction-00-best-metrics.png",
        "Impaction (ToothTruth / vzrad2 train-4) — class mAP50 in product",
        {"mAP50": 95.5},
    )
    save_four_map()
    save_four_all_metrics()
    print("wrote", OUT)
