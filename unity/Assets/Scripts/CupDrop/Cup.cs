using UnityEngine;

namespace CupHero.CupDrop
{
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(Collider2D))]
    public class Cup : MonoBehaviour
    {
        [SerializeField] private int initialBalls = 100;

        private CupDropController controller;
        private bool resolved;

        private void Start()
        {
            controller = FindObjectOfType<CupDropController>();
            resolved = false;
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (resolved)
                return;

            MultiplierSlot slot = collision.GetComponent<MultiplierSlot>();
            if (slot != null)
            {
                resolved = true;
                int finalBalls = initialBalls * slot.Multiplier;
                if (controller != null)
                {
                    controller.ReportCupResult(finalBalls);
                }
                Destroy(gameObject);
            }
        }
    }
}
