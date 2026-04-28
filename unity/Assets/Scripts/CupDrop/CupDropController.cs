using UnityEngine;

namespace CupHero.CupDrop
{
    public class CupDropController : MonoBehaviour
    {
        [SerializeField] private GameObject cupPrefab;
        [SerializeField] private float dropZoneY = 5f;
        [SerializeField] private float minX = -4f;
        [SerializeField] private float maxX = 4f;
        [SerializeField] private float moveSpeed = 5f;
        [SerializeField] private int dropsPerRound = 3;
        [SerializeField] private Transform indicator;

        private float currentX;
        private int ballsCollectedThisRound;
        private int dropsRemaining;
        private int dropsResolvedThisRound;

        public int DropsRemaining => dropsRemaining;
        public int BallsCollectedThisRound => ballsCollectedThisRound;

        public event System.Action<int> OnRoundFinished;
        public event System.Action<int> OnBallsCollected;

        private void Start()
        {
            currentX = 0f;
            dropsRemaining = dropsPerRound;
            ballsCollectedThisRound = 0;
        }

        private void Update()
        {
            HandleInput();
            UpdateIndicatorPosition();
        }

        private void HandleInput()
        {
            float moveInput = Input.GetAxis("Horizontal");
            if (Input.GetKey(KeyCode.A))
                moveInput = -1f;
            if (Input.GetKey(KeyCode.D))
                moveInput = 1f;

            currentX += moveInput * moveSpeed * Time.deltaTime;
            currentX = Mathf.Clamp(currentX, minX, maxX);

            if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.Space))
            {
                if (dropsRemaining > 0)
                {
                    DropCup();
                }
            }
        }

        private void UpdateIndicatorPosition()
        {
            if (indicator != null)
            {
                indicator.position = new Vector3(currentX, dropZoneY, 0f);
            }
        }

        private void DropCup()
        {
            GameObject cupInstance = Instantiate(cupPrefab, new Vector3(currentX, dropZoneY, 0f), Quaternion.identity);
            dropsRemaining--;
        }

        public void ReportCupResult(int balls)
        {
            ballsCollectedThisRound += balls;
            OnBallsCollected?.Invoke(balls);

            dropsResolvedThisRound++;
            if (dropsResolvedThisRound >= dropsPerRound)
            {
                OnRoundFinished?.Invoke(ballsCollectedThisRound);
            }
        }

        public void ResetRound()
        {
            ballsCollectedThisRound = 0;
            dropsRemaining = dropsPerRound;
            dropsResolvedThisRound = 0;
        }
    }
}
