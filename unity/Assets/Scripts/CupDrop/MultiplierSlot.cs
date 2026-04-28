using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace CupHero.CupDrop
{
    [RequireComponent(typeof(Collider2D))]
    public class MultiplierSlot : MonoBehaviour
    {
        [SerializeField] private int multiplier = 2;

        public int Multiplier => multiplier;

        private void Awake()
        {
            Collider2D col = GetComponent<Collider2D>();
            col.isTrigger = true;
        }

        private void OnDrawGizmos()
        {
#if UNITY_EDITOR
            Handles.Label(transform.position, multiplier.ToString());
#endif
        }
    }
}
