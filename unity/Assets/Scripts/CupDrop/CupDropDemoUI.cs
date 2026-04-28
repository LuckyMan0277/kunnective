using UnityEngine;
using TMPro;

namespace CupHero.CupDrop
{
    public class CupDropDemoUI : MonoBehaviour
    {
        [SerializeField] private CupDropController controller;
        [SerializeField] private TextMeshProUGUI ballCountText;
        [SerializeField] private TextMeshProUGUI dropsRemainingText;

        private void OnEnable()
        {
            if (controller != null)
            {
                controller.OnBallsCollected += HandleBallsCollected;
                controller.OnRoundFinished += HandleRoundFinished;
            }
            RefreshLabels();
        }

        private void OnDisable()
        {
            if (controller != null)
            {
                controller.OnBallsCollected -= HandleBallsCollected;
                controller.OnRoundFinished -= HandleRoundFinished;
            }
        }

        public void OnStartRoundClicked()
        {
            if (controller != null)
            {
                controller.ResetRound();
                RefreshLabels();
            }
        }

        private void HandleBallsCollected(int balls)
        {
            RefreshLabels();
        }

        private void HandleRoundFinished(int totalBalls)
        {
            RefreshLabels();
        }

        private void RefreshLabels()
        {
            if (controller == null) return;
            if (ballCountText != null)
                ballCountText.text = $"Balls: {controller.BallsCollectedThisRound}";
            if (dropsRemainingText != null)
                dropsRemainingText.text = $"Drops: {controller.DropsRemaining}";
        }
    }
}
